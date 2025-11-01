import json
import time

import requests


class NoteSync:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def sync_note(self, url, frontmatter, body):
        if self.note_exists(url):
            print(f"Note exists, will patch frontmatter: {url}")
            self.patch_frontmatter(url, frontmatter)
        else:
            print(f"Note does not exist, will create note: {url}")
            self.put_note(url, body)

    def put_note(self, url, body):
        headers = self.__obsidian_headers()
        headers["Content-Type"] = "text/markdown"
        response = requests.put(url, headers=headers, data=body)
        if response.status_code != 204:
            print("Response was not 204:")
            print(response.text)
            raise RuntimeError()
        response.close()
        time.sleep(0.01)

    def patch_frontmatter(self, url, frontmatter):
        for key, value in frontmatter.items():
            self.patch_frontmatter_property(url, key, value)

    def patch_frontmatter_property(self, url, key, value):
        headers = self.__obsidian_headers()
        headers["Content-Type"] = "application/json"
        headers["Operation"] = "replace"
        headers["Target-Type"] = "frontmatter"
        headers["Target"] = key
        headers["Create-Target-If-Missing"] = "true"
        data = json.dumps(value)
        response = requests.patch(url, headers=headers, data=data)
        if response.status_code != 200:
            print("Response was not 200:")
            print(response.text)
            raise RuntimeError()
        response.close()
        time.sleep(0.01)

    def note_exists(self, url):
        headers = self.__obsidian_headers()
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            result = True
        elif response.status_code == 404:
            result = False
        else:
            print("Response was neither 200 nor 404:")
            print(response.text)
            raise RuntimeError()
        response.close()
        time.sleep(0.01)
        return result

    def __obsidian_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
        }
