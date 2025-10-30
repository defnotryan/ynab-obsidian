import json


class ServerKnowledge:
    def __init__(
        self, last_server_knowledge_filename: str = ".last_server_knowledge.json"
    ):
        self.last_server_knowledge_filename = last_server_knowledge_filename

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
