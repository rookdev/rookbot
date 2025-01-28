from shutil import copy
import os

with open(".env.GLOBAL", encoding="utf-8") as envFile:
    envData = envFile.read()
    as_line = False
    path_line = False
    assign_line = False
    envPath = ""
    envLines = []
    for line in envData.split("\n"):
        line = line.strip()
        if " as " in line or " to " in line:
            as_line = True
            path_line = False
            assign_line = False
            if len(envLines) > 2:
                print(envPath)
                envDir = os.path.dirname(envPath)
                if not os.path.isdir(envDir):
                    os.makedirs(envDir)
                with open(envPath, "w", encoding="utf-8") as thisEnvFile:
                    toPrint = "\n".join(envLines)
                    thisEnvFile.write(toPrint)
                envLines = []
        if ": " in line:
            as_line = False
            path_line = True
            assign_line = False
        if "=" in line:
            as_line = False
            path_line = False
            assign_line = True
        if as_line:
            user = line
            envLines.append(line)
        if path_line:
            path = line
            envPath = line[line.find(": ")+2:].strip()
            envLines.append(line)
        if assign_line:
            envLines.append(line)

if len(envLines) > 2:
    print(envPath)
    with open(envPath, "w", encoding="utf-8") as thisEnvFile:
        toPrint = "\n".join(envLines)
        thisEnvFile.write(toPrint)
    envLines = []

for [srcFile, dstFile] in {
    "./env/devs/.env.token.gitrook":    "./.env.token.ci",
    "./env/devs/.env.client.gitrook":   "./.env.client.ci",
    "./env/envs/.env.dev":              "./.env.dev.ci",
    "./env/envs/.env.prod":             "./.env.prod.ci"
}.items():
    print(f"Creating: {dstFile}")
    copy(
        srcFile,
        dstFile
    )

for dstFile in [ "dev", "prod" ]:
    with open(os.path.join(".",f".env.{dstFile}.ci"), "a+", encoding="utf-8") as environmentFile:
        for srcFile in [
            "./.env.token.ci",
            "./.env.client.ci"
        ]:
            with open(srcFile, "r", encoding="utf-8") as credFile:
                environmentFile.write(
                    "\n" +
                    credFile.read()
                )

for delFile in [ "./.env.token.ci", "./.env.client.ci" ]:
    os.remove(delFile)
