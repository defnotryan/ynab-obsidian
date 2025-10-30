import os

import yaml
import ynab

from ynab_obsidian.account_snapshots import AccountSnapshots
from ynab_obsidian.transactions import Transactions
from ynab_obsidian.vault import Vault


def main():
    # pprint(app_config)
    ynab_api_config = get_ynab_api_config(app_config)
    vault = Vault(app_config)
    budget_id = app_config["ynab"]["budget"]
    with ynab.ApiClient(ynab_api_config) as api_client:
        transactions = Transactions(vault, api_client, app_config)
        transactions.update_transactions(budget_id)
        account_snapshots = AccountSnapshots(vault, api_client)
        account_snapshots.update_account_snapshots(budget_id)


def get_ynab_api_config(app_config):
    return ynab.Configuration(access_token=app_config["ynab_pat"])


def get_app_config():
    new_app_config = None
    try:
        with open("config.yaml") as f:
            new_app_config = yaml.safe_load(f)
    except FileNotFoundError:
        print("No config.yaml found")
        raise RuntimeError("No config.yaml found")
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
    if "account_snapshots_folder_path" not in new_app_config["obsidian"]:
        new_app_config["obsidian"]["account_snapshots_folder_path"] = "AccountSnapshots"
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


app_config = get_app_config()

if __name__ == "__main__":
    main()
