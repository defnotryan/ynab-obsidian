class Vault:
    def __init__(self, app_config):
        self.app_config = app_config

    def files_base_url(self):
        host = self.app_config["obsidian"]["host"]
        port = self.app_config["obsidian"]["port"]
        return f"http://{host}:{port}/vault"

    def account_snapshots_folder_url(self):
        base_url = self.files_base_url()
        account_snapshots_folder_path = self.app_config["obsidian"][
            "account_snapshots_folder_path"
        ]
        return f"{base_url}/{account_snapshots_folder_path}"

    def transactions_folder_url(self):
        base_url = self.files_base_url()
        transactions_folder_path = self.app_config["obsidian"][
            "transaction_folder_path"
        ]
        return f"{base_url}/{transactions_folder_path}"

    def category_folder_url(self):
        base_url = self.files_base_url()
        category_folder_path = self.app_config["obsidian"]["category_folder_path"]
        return f"{base_url}/{category_folder_path}"

    def api_key(self):
        return self.app_config["obsidian_api_key"]
