import datetime

import ynab

from ynab_obsidian.server_knowledge import ServerKnowledge
from ynab_obsidian.note_sync import NoteSync
from ynab_obsidian.util import frontmatter_dict_to_md, normalize_amount
from ynab_obsidian.vault import Vault
from ynab import Account


class AccountSnapshots:
    def __init__(self, vault: Vault, ynab_api_client: ynab.ApiClient):
        self.vault = vault
        self.ynab_api_client = ynab_api_client
        self.note_sync = NoteSync(api_key=vault.api_key())

    def update_account_snapshots(self, budget_id):
        accounts_api = ynab.AccountsApi(self.ynab_api_client)
        server_knowledge = ServerKnowledge()
        accounts_last_server_knowledge = (
            server_knowledge.get_accounts_last_server_knowledge()
        )
        print(f"Accounts last server knowledge: {accounts_last_server_knowledge}")
        accounts_response = accounts_api.get_accounts(
            budget_id, last_knowledge_of_server=accounts_last_server_knowledge
        )
        print(f"Accounts to process: {len(accounts_response.data.accounts)}")
        for account in accounts_response.data.accounts:
            if not account.closed and not account.deleted:
                self.sync_account_snapshot(account)
        server_knowledge.save_accounts_last_server_knowledge(
            accounts_response.data.server_knowledge
        )

    def sync_account_snapshot(self, account: Account):
        url = self.__url_for_account_snapshot_note(account)
        frontmatter = self.__create_account_snapshot_frontmatter(account)
        body = self.__generate_account_snapshot_note_body(account)
        self.note_sync.sync_note(url=url, frontmatter=frontmatter, body=body)

    def __generate_account_snapshot_note_body(self, account: Account):
        document = ""
        frontmatter = self.__create_account_snapshot_frontmatter(account)
        document += frontmatter_dict_to_md(frontmatter)
        return document

    def __create_account_snapshot_frontmatter(self, account: Account):
        now = datetime.datetime.now()
        account_type = account.type.value
        frontmatter = {
            "tags": ["ynab_account_snapshot", f"account_{account_type}"],
            "timestamp": now.isoformat(),
            "account_id": account.id,
            "account_name": account.name,
            "account_type": account_type,
            "balance": normalize_amount(account.balance),
            "cleared_balance": normalize_amount(account.cleared_balance),
        }
        return frontmatter

    def __url_for_account_snapshot_note(self, account: Account):
        folder_url = self.vault.account_snapshots_folder_url()
        today = datetime.date.today()
        filename = f"{today.year}-{today.month:02}-{today.day:02}-{account.id}.md"
        return f"{folder_url}/{filename}"
