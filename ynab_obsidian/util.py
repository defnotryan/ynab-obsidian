import yaml


def normalize_amount(amount):
    return amount / 1000


def normalize_var_date(var_date):
    return var_date.strftime("%Y-%m-%d")


def frontmatter_dict_to_md(frontmatter):
    document = "---\n"
    document += yaml.dump(frontmatter, default_flow_style=False)
    document += "---\n"
    return document
