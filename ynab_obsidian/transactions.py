import datetime
from collections import defaultdict

import ynab

from ynab_obsidian.note_sync import NoteSync
from ynab_obsidian.util import (
    normalize_amount,
    normalize_var_date,
    frontmatter_dict_to_md,
)
from ynab_obsidian.vault import Vault


class Transactions:
    def __init__(self, vault: Vault, ynab_api_client: ynab.ApiClient, app_config: dict):
        self.vault = vault
        self.ynab_api_client = ynab_api_client
        self.note_sync = NoteSync(api_key=vault.api_key())
        self.income_categories: list = app_config["ynab"]["income_categories"]
        self.category_mapping: dict = app_config["ynab"]["category_mapping"]

    def update_transactions(self, budget_id):
        transactions_api = ynab.TransactionsApi(self.ynab_api_client)
        transactions_response = transactions_api.get_transactions(
            budget_id, since_date="2025-07-01"
        )
        self.process_transactions(transactions_response.data.transactions)

    def process_transactions(self, transactions):
        reportable_transactions = [
            t for t in transactions if is_transaction_reportable(t)
        ]
        for transaction in reportable_transactions:
            self.sync_transaction_note(transaction)

        transactions_by_year_month_category = defaultdict(
            lambda: defaultdict(lambda: defaultdict(list))
        )
        spending_transactions = [
            t for t in reportable_transactions if not self.is_transaction_income(t)
        ]
        for transaction in spending_transactions:
            year = transaction.var_date.year
            month = transaction.var_date.month
            if len(transaction.subtransactions) > 0:
                for subtransaction in transaction.subtransactions:
                    category = self.map_category(subtransaction.category_name)
                    transactions_by_year_month_category[year][month][category].append(
                        subtransaction
                    )
            else:
                category = self.map_category(transaction.category_name)
                transactions_by_year_month_category[year][month][category].append(
                    transaction
                )

        for year in transactions_by_year_month_category.keys():
            for month in transactions_by_year_month_category[year].keys():
                for category in transactions_by_year_month_category[year][month].keys():
                    self.sync_category_month_note(
                        year,
                        month,
                        category,
                        transactions_by_year_month_category[year][month][category],
                    )

    def sync_transaction_note(self, transaction, parent_transaction=None):
        if (
            hasattr(transaction, "subtransactions")
            and len(transaction.subtransactions) > 0
        ):
            for subtransaction in transaction.subtransactions:
                self.sync_transaction_note(subtransaction, transaction)
        else:
            url = self.__url_for_transaction_note(transaction, parent_transaction)
            frontmatter = self.__frontmatter_for_transaction_note(
                transaction, parent_transaction
            )
            body = self.__body_for_transaction_note(transaction, parent_transaction)
            self.note_sync.sync_note(url=url, frontmatter=frontmatter, body=body)

    def sync_category_month_note(self, year, month, category, transactions):
        url = self.__url_for_category_month_note(year, month, category)
        frontmatter = self.__frontmatter_for_category_month_note(
            year, month, category, transactions
        )
        body = self.__body_for_category_month_note(year, month, category, transactions)
        self.note_sync.sync_note(url=url, frontmatter=frontmatter, body=body)

    def map_category(self, category):
        trimmed_category = category.strip()
        if trimmed_category in self.category_mapping:
            return self.category_mapping[trimmed_category]
        return trimmed_category

    def is_category_income(self, category_name):
        return category_name in self.income_categories

    def is_transaction_income(self, transaction):
        return (
            transaction.approved
            and transaction.cleared
            and self.is_category_income(transaction.category_name)
        )

    def __url_for_transaction_note(self, transaction, parent_transaction=None):
        year = (
            parent_transaction.var_date.year
            if parent_transaction
            else transaction.var_date.year
        )
        month = (
            parent_transaction.var_date.month
            if parent_transaction
            else transaction.var_date.month
        )
        transaction_folder_url = self.vault.transactions_folder_url()
        filename = f"{transaction.id}.md"
        url = f"{transaction_folder_url}/{year}/{month:02}/{filename}"
        return url

    def __frontmatter_for_transaction_note(self, transaction, parent_transaction=None):
        if parent_transaction:
            account_name = parent_transaction.account_name
            date = normalize_var_date(parent_transaction.var_date)
            year = parent_transaction.var_date.year
            month = parent_transaction.var_date.month
            is_income = self.is_transaction_income(parent_transaction)
        else:
            account_name = transaction.account_name
            date = normalize_var_date(transaction.var_date)
            year = transaction.var_date.year
            month = transaction.var_date.month
            is_income = self.is_transaction_income(transaction)
        return {
            "tags": ["ynab_transaction", f"year-{year}", f"month-{month:02}"],
            "transaction_id": transaction.id,
            "is_subtransaction": parent_transaction is not None,
            "payee": transaction.payee_name,
            "account": account_name,
            "amount": normalize_amount(transaction.amount),
            "date": date,
            "category": self.map_category(transaction.category_name),
            "ynab_category": transaction.category_name,
            "imported_timestamp": datetime.datetime.now().isoformat(),
            "is_income": is_income,
            "memo": transaction.memo,
        }

    def __body_for_transaction_note(self, transaction, parent_transaction=None):
        document = ""
        frontmatter = self.__frontmatter_for_transaction_note(
            transaction, parent_transaction
        )
        document += frontmatter_dict_to_md(frontmatter)
        return document

    def __url_for_category_month_note(self, year, month, category):
        category_folder_url = self.vault.category_folder_url()
        filename = f"{year}-{month:02} {category}.md"
        url = f"{category_folder_url}/{year}/{month:02}/{filename}"
        return url

    def __frontmatter_for_category_month_note(
        self, year, month, category, transactions
    ):
        return {
            "tags": ["category_month_summary"],
            "category": category,
            "month": f"{year}-{month:02}",
            "display_month": datetime.date(year, month, 1).strftime("%B %Y"),
            "total": normalize_amount(sum((t.amount for t in transactions))) * -1,
            "transactions": [t.id for t in transactions],
            "last_updated": datetime.datetime.now().isoformat(),
        }

    def __body_for_category_month_note(self, year, month, category, transactions):
        document = ""
        frontmatter = self.__frontmatter_for_category_month_note(
            year, month, category, transactions
        )
        document += frontmatter_dict_to_md(frontmatter)
        document += "# Transactions"
        document += f"""
```dataview
       TABLE WITHOUT ID
           date AS "Date",
           account AS "Account",
           payee AS "Payee",
           ynab_category AS "YNAB Category",
           currencyformat(amount * -1, "USD") AS "Spent",
           file.link AS "Link"
       FROM "Transactions/{year}/{month:02}"
       WHERE category = "{category}"
       SORT date ASC
```\n"""
        document += "# Notes\n\n"
        return document


def is_transaction_reportable(transaction):
    return (
        transaction.approved
        and transaction.cleared
        and not transaction.transfer_transaction_id
    )
