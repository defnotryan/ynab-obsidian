import yaml
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class ObsidianConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 27123
    secure: bool = False
    transaction_folder_path: str = "Transactions"
    category_folder_path: str = "Spending By Category"
    account_snapshots_folder_path: str = "AccountSnapshots"


class YnabConfig(BaseModel):
    budget: str = "last-used"
    category_mapping: dict = {}
    income_categories: list = ["Inflow: Ready to Assign"]


class AppSettings(BaseSettings):
    obsidian: ObsidianConfig
    obsidian_api_key: str
    ynab: YnabConfig
    ynab_pat: str
    last_server_knowledge_filename: str = ".last_server_knowledge.json"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


with open("config.yaml") as f:
    config_dict = yaml.safe_load(f)
app_config = AppSettings(**config_dict)
