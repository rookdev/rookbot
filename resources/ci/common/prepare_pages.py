import json
import os                               # for env vars
from shutil import copy, copytree, move # file manipulation

def prepare_pages():
    # copy GitHub Pages files to staging area
    srcDir  = os.path.join(".", "html")
    destDir = os.path.join("..", "pages", "resources", "app")
    if not os.path.isdir(destDir):
        copytree(
            srcDir,
            destDir
        )

    # move index to index
    srcFile  = os.path.join("..", "pages", "resources", "app", "index.html")
    destFile = os.path.join("..", "pages", "index.html")
    if os.path.isfile(srcFile):
        move(
            srcFile,
            destFile
        )

    # remove readme
    readmePath = os.path.join("..", "pages", "resources", "app", "README.md")
    if os.path.isfile(readmePath):
        os.remove(readmePath)

    # make dirs for resources
    for checkdir in [
        os.path.join("..", "pages", "resources", "app", "media"),
        os.path.join("..", "pages", "resources", "app", "meta", "manifests")
    ]:
        if not os.path.isdir(checkdir):
            os.makedirs(checkdir)

    # copy app_version over
    copy(
        os.path.join(".", "package.json"),
        os.path.join("..", "pages", "resources", "app", "meta", "manifests")
    )
    # copy help file over
    copy(
        os.path.join(".", "src", "res", "app", "manifests", "help", "help.json"),
        os.path.join("..", "pages", "resources", "app", "meta", "manifests")
    )
    # copy bot image over
    copy(
        os.path.join(".", "src", "res", "media", "rookbotIcon.png"),
        os.path.join("..", "pages", "resources", "app", "media")
    )

    with(open(os.path.join(".","package.json"),"r")) as PACKAGE:
        PACKAGE_JSON = json.load(PACKAGE)
        VERSION = PACKAGE_JSON["version"]
    with(open(os.path.join("..","pages","commit.txt"),"w")) as commit:
        commit.write("Update Site to v" + VERSION)

    # copy badges manifest over
    copy(
        os.path.join(".", "resources", "app", "meta", "manifests", "badges.json"),
        os.path.join("..", "pages", "resources", "app", "meta", "manifests")
    )


def main():
    prepare_pages()

if __name__ == "__main__":
    main()
else:
    raise AssertionError("Script improperly used as import!")
