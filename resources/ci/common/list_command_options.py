import json
import os

helpPath = os.path.join(
    ".",
    "src",
    "res",
    "app",
    "manifests",
    "help",
    "help.json"
)

optionCounts = {}

if os.path.isfile(helpPath):
    with open(helpPath, "r", encoding="utf-8") as helpFile:
        helpJSON = json.load(helpFile)
        for [sectionName, sectionCmds] in helpJSON.items():
            for [cmdName, cmd] in sectionCmds.items():
                if "options" in cmd:
                    for option in cmd["options"]:
                        if option["name"] not in optionCounts:
                            optionCounts[option["name"]] = 1
                        else:
                            optionCounts[option["name"]] += 1

optionsByCount = {}
for [optionName, optionCount] in optionCounts.items():
    if optionCount not in optionsByCount:
        optionsByCount[optionCount] = []
    optionsByCount[optionCount].append(optionName)
    optionsByCount[optionCount] = sorted(optionsByCount[optionCount])

print(json.dumps(optionsByCount, indent=2))
