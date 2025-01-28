import json
import os
from shutil import copy

copy(
    os.path.join(".","src","PROFILE-example.json"),
    os.path.join(".","src","PROFILE.json")
)
with open(os.path.join(".","src","PROFILE.json"), "r+", encoding="utf-8") as profileFile:
    profileJSON = json.load(profileFile)
    profileJSON["selectedprofile"] = "gitrook"
    profileFile.seek(0)
    profileFile.truncate()
    profileFile.seek(0)
    json.dump(profileJSON, profileFile)
