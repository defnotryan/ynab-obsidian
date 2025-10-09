import os
from pprint import pprint

import ynab


def main():
    if not "YNAB_PAT" in os.environ:
        raise ValueError("YNAB_PAT environment variable not set")
    configuration = get_config()
    with ynab.ApiClient(configuration) as api_client:
        transactions_api = ynab.TransactionsApi(api_client)
        budget_id = "last-used"
        transactions = transactions_api.get_transactions(budget_id, since_date="2025-10-05")
        pprint(transactions)


def get_config():
    return ynab.Configuration(access_token=os.environ["YNAB_PAT"])


if __name__ == "__main__":
    main()
