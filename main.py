import datetime
import os
from collections import defaultdict

import requests
import yaml
import ynab


def main():
    ynab_api_config = get_ynab_api_config(app_config)
    with ynab.ApiClient(ynab_api_config) as api_client:
        transactions_api = ynab.TransactionsApi(api_client)
        budget_id = app_config["ynab"]["budget"]
        transactions_response = transactions_api.get_transactions(
            budget_id, since_date="2025-09-01"
        )
        process_transactions(transactions_response.data.transactions)


def get_ynab_api_config(app_config):
    return ynab.Configuration(access_token=app_config["ynab_pat"])


def get_app_config():
    new_app_config = None
    try:
        with open("config.yaml") as f:
            new_app_config = yaml.safe_load(f)
    except FileNotFoundError:
        new_app_config = {}
    if "obsidian" not in new_app_config:
        new_app_config["obsidian"] = {
            "host": "127.0.0.1",
            "port": 27123,
            "secure": False,
            "transaction_folder_path": "Transactions",
            "category_folder_path": "Categories",
        }
    if "host" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["host"] = "127.0.0.1"
    if "port" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["port"] = 27123
    if "secure" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["secure"] = False
    if "transaction_folder_path" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["transaction_folder_path"] = "Transactions"
    if "category_folder_path" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["category_folder_path"] = "Categories"
    if "ynab" not in new_app_config:
        new_app_config["ynab"] = {"budget": "last_used", "category_mapping": {}}
    if "budget" not in new_app_config["ynab"]:
        new_app_config["ynab"]["budget"] = "last_used"
    if "category_mapping" not in new_app_config["ynab"]:
        new_app_config["ynab"]["category_mapping"] = {}
    if "YNAB_PAT" not in os.environ:
        raise ValueError("YNAB_PAT environment variable not set")
    new_app_config["ynab_pat"] = os.environ["YNAB_PAT"]
    if "OBSIDIAN_API_KEY" not in os.environ:
        raise ValueError("OBSIDIAN_API_KEY environment variable not set")
    new_app_config["obsidian_api_key"] = os.environ["OBSIDIAN_API_KEY"]
    return new_app_config


def create_category_month_note(year, month, category, transactions):
    document = generate_category_month_note_body(year, month, category, transactions)
    put_category_month_note(year, month, category, document)


def process_transactions(transactions):
    reportable_transactions = [t for t in transactions if is_transaction_reportable(t)]
    for transaction in reportable_transactions:
        create_transaction_note(transaction)

    transactions_by_year_month_category = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    spending_transactions = [
        t for t in reportable_transactions if not is_transaction_income(t)
    ]
    for transaction in spending_transactions:
        year = transaction.var_date.year
        month = transaction.var_date.month
        category = map_category(transaction.category_name)
        transactions_by_year_month_category[year][month][category].append(transaction)

    for year in transactions_by_year_month_category.keys():
        for month in transactions_by_year_month_category[year].keys():
            for category in transactions_by_year_month_category[year][month].keys():
                create_category_month_note(
                    year,
                    month,
                    category,
                    transactions_by_year_month_category[year][month][category],
                )


def create_transaction_note(transaction):
    document = generate_transaction_note_body(transaction)
    put_transaction_note(transaction, document)


def generate_transaction_note_body(transaction) -> str:
    document = ""
    frontmatter = create_transaction_frontmatter(transaction)
    document += frontmatter_dict_to_md(frontmatter)
    if transaction.memo:
        document += f"{transaction.memo}\n"
    return document


def generate_category_month_note_body(year, month, category, transactions):
    document = ""
    frontmatter = create_category_month_frontmatter(year, month, category, transactions)
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
        FROM "Transactions/{year}/{month}"
        WHERE category = "{category}"
        SORT date ASC
```\n"""
    document += "# Notes\n\n"
    return document


def create_transaction_frontmatter(transaction):
    frontmatter = {
        "type": "ynab_transaction",
        "transaction_id": transaction.id,
        "payee": transaction.payee_name,
        "account": transaction.account_name,
        "amount": normalize_amount(transaction.amount),
        "date": normalize_var_date(transaction.var_date),
        "category": map_category(transaction.category_name),
        "ynab_category": transaction.category_name,
        "imported_timestamp": datetime.datetime.now().isoformat(),
        "is_income": is_transaction_income(transaction),
    }
    return frontmatter


def create_category_month_frontmatter(year, month, category, transactions):
    frontmatter = {
        "type": "category_month_summary",
        "category": category,
        "month": month,
        "year": year,
        "total": normalize_amount(sum(t.amount for t in transactions)) * -1,
        "transactions": [t.id for t in transactions],
    }
    return frontmatter


def frontmatter_dict_to_md(frontmatter):
    document = "---\n"
    document += yaml.dump(frontmatter, default_flow_style=False)
    document += "---\n"
    return document


def map_category(category):
    if category in app_config["ynab"]["category_mapping"]:
        return app_config["ynab"]["category_mapping"][category]
    return category


def normalize_amount(amount):
    return amount / 1000


def normalize_var_date(var_date):
    return var_date.strftime("%Y-%m-%d")


def put_transaction_note(transaction, document):
    year = transaction.var_date.year
    month = transaction.var_date.month
    transaction_folder_url = vault_transaction_folder_url()
    filename = f"{transaction.id}.md"
    url = f"{transaction_folder_url}/{year}/{month:02}/{filename}"
    obsidian_api_key = os.environ["OBSIDIAN_API_KEY"]
    headers = {
        "Content-Type": "text/markdown",
        "Authorization": f"Bearer {obsidian_api_key}",
    }
    response = requests.put(url, data=document, headers=headers)
    if response.status_code != 204:
        print("Response was not 204:")
        print(response.text)
        raise RuntimeError()


def put_category_month_note(year, month, category, document):
    category_folder_url = vault_category_folder_url()
    filename = f"{category}.md"
    url = f"{category_folder_url}/{year}/{month:02}/{filename}"
    obsidian_api_key = os.environ["OBSIDIAN_API_KEY"]
    headers = {
        "Content-Type": "text/markdown",
        "Authorization": f"Bearer {obsidian_api_key}",
    }
    response = requests.put(url, data=document, headers=headers)
    if response.status_code != 204:
        print("Response was not 204:")
        print(response.text)
        raise RuntimeError()


def is_transaction_reportable(transaction):
    return (
        transaction.approved
        and transaction.cleared
        and not transaction.transfer_transaction_id
    )


def is_transaction_income(transaction):
    return (
        transaction.approved
        and transaction.cleared
        and is_category_income(transaction.category_name)
    )


def is_category_income(category_name):
    return category_name in app_config["ynab"]["income_categories"]


def vault_files_base_url():
    host = app_config["obsidian"]["host"]
    port = app_config["obsidian"]["port"]
    return f"http://{host}:{port}/vault"


def vault_transaction_folder_url():
    base_url = vault_files_base_url()
    return base_url + "/" + app_config["obsidian"]["transaction_folder_path"]


def vault_category_folder_url():
    base_url = vault_files_base_url()
    return base_url + "/" + app_config["obsidian"]["category_folder_path"]


app_config = get_app_config()

if __name__ == "__main__":
    main()
