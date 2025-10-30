import json

from ynab_obsidian.app_config import app_config


class ServerKnowledge:
    def __init__(self):
        self.last_server_knowledge_filename = app_config.last_server_knowledge_filename

    def get_accounts_last_server_knowledge(self):
        last_server_knowledge = self.get_last_server_knowledge()
        if "accounts" in last_server_knowledge:
            return last_server_knowledge["accounts"]
        else:
            return None

    def save_accounts_last_server_knowledge(self, accounts_last_server_knowledge):
        if not accounts_last_server_knowledge:
            return
        last_server_knowledge = self.get_last_server_knowledge()
        last_server_knowledge["accounts"] = accounts_last_server_knowledge
        self.save_last_server_knowledge(last_server_knowledge)

    def get_transactions_last_server_knowledge(self):
        last_server_knowledge = self.get_last_server_knowledge()
        if "transactions" in last_server_knowledge:
            return last_server_knowledge["transactions"]
        else:
            return None

    def save_transactions_last_server_knowledge(
        self, transactions_last_server_knowledge
    ):
        if not transactions_last_server_knowledge:
            return
        last_server_knowledge = self.get_last_server_knowledge()
        last_server_knowledge["transactions"] = transactions_last_server_knowledge
        self.save_last_server_knowledge(last_server_knowledge)

    def save_last_server_knowledge(self, last_server_knowledge):
        with open(self.last_server_knowledge_filename, "w") as f:
            print("Saving last server knowledge...")
            print(json.dumps(last_server_knowledge, indent=4))
            json.dump(last_server_knowledge, f)

    def get_last_server_knowledge(self):
        try:
            with open(self.last_server_knowledge_filename) as f:
                last_server_knowledge = json.load(f)
        except FileNotFoundError:
            last_server_knowledge = {}
        return last_server_knowledge
