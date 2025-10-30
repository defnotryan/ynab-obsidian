import ynab

from ynab_obsidian.app_config import app_config
from ynab_obsidian.account_snapshots import AccountSnapshots
from ynab_obsidian.transactions import Transactions
from ynab_obsidian.vault import Vault


def main():
    # pprint(app_config)
    ynab_api_config = get_ynab_api_config(app_config)
    vault = Vault(app_config)
    budget_id = app_config.ynab.budget
    with ynab.ApiClient(ynab_api_config) as api_client:
        transactions = Transactions(vault, api_client)
        transactions.update_transactions(budget_id)
        account_snapshots = AccountSnapshots(vault, api_client)
        account_snapshots.update_account_snapshots(budget_id)


def get_ynab_api_config(app_config):
    return ynab.Configuration(access_token=app_config.ynab_pat)


if __name__ == "__main__":
    main()
