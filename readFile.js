const readFile = function (file) {
    let readText = Buffer.from(file.buffer).toString("utf-8");
    //Remove metadata and empty lines. Slice last empty line
    let splitNewLines = readText.split("[metadata]")[0].split(/[\n\r]+/).slice(0, -1)
    let objectList = [];
    let objectPackage = {
        name: "",
        details: {
            description: "",
            category: "",
            optional: "",
            pythonVersions: ""
        },
        packageDependencies: [],
        packageExtras: [],
        reverseDependencies: []
    }
    let installedList = [];

    //Check first for installed packages and push them to array
    for (let line in splitNewLines) {
        if (splitNewLines[line] === "[[package]]") {
            objectPackage = {
                name: splitNewLines[parseInt(line) + 1].match(/"([^"]*)"/)[1],
            }
            installedList.push(objectPackage);
        }
    }

    //Start checking for dependencies and build final object list
    for (let line in splitNewLines) {
        let packageAlreadyInList = false;
        if (splitNewLines[line] === "[[package]]") {
            objectPackage = {
                name: splitNewLines[parseInt(line) + 1].match(/"([^"]*)"/)[1],
                details: {
                    description: splitNewLines[parseInt(line) + 3].match(/"([^"]*)"/)[1],
                    optional: splitNewLines[parseInt(line) + 5].split("=")[1].trim(),
                    pythonVersions: splitNewLines[parseInt(line) + 6].match(/"([^"]*)"/)[1]
                },
                packageDependencies: [],
                packageExtras: [],
                reverseDependencies: []
            }
        }

        if (splitNewLines[line] === "[package.dependencies]") {
            let countingDependencies = true;
            let packageDependencyList = [];

            for (let y = parseInt(line) + 1; countingDependencies; y++) {
                if (splitNewLines[y] === "[[package]]" || splitNewLines[y] === "[package.extras]" || splitNewLines[y] === undefined) {
                    countingDependencies = false;
                    break;
                }
                let matchOptionalDependency = splitNewLines[y].match(/optional = true/)
                let listString = splitNewLines[y].match(/([^=]*)=(.*)/)[1].trim()

                let dependencyObject = {
                    name: listString,
                    clickable: false,
                    optional: false
                }

                if (matchOptionalDependency) {
                    dependencyObject.optional = true
                }

                //Check if package is installed using the previous installedList array
                for (let package in installedList) {
                    if (installedList[package].name === listString) {
                        dependencyObject.clickable = true
                        break;
                    }
                }

                packageDependencyList.push(dependencyObject)
            }
            objectPackage.packageDependencies.push(...packageDependencyList)
        }

        if (splitNewLines[line] === "[package.extras]") {
            let countingExtras = true;
            let packageExtraList = [];

            for (let i = parseInt(line) + 1; countingExtras; i++) {

                if (splitNewLines[i] === "[[package]]" || splitNewLines[i] === undefined) {
                    countingExtras = false;
                    break;
                }

                //Match for = and select packages part, slice brackets
                //Match for package version numbers and remove them
                let listString = splitNewLines[i].match(/([^=]*)=(.*)/)[2].slice(2, -1).replace(/ *\([^)]*\) */g, "")
                let newArray = listString.split(",")

                newArray.forEach((element, index) => {
                    let match1 = element.match(/\[([^\]]+)]/)

                    if (match1) {
                        let newPackage = element.replace(/\[([^\]]+)]/, "")
                        newArray.splice(index, 1, newPackage)
                        newArray.push("'" + match1[1] + "'")
                    }
                });

                //Check for packages inside brackets
                let cleanedArray = []
                for (let extraLine in newArray) {
                    cleanedArray.push(newArray[extraLine].slice(1, -1).replace('"', ""))
                }
                cleanedArray.sort()

                let optionalDependencyObject = {
                    name: "",
                    clickable: false
                }

                for (let item in cleanedArray) {
                    optionalDependencyObject = {
                        name: cleanedArray[item],
                        clickable: false
                    }
                    cleanedArray[item] = optionalDependencyObject;
                }

                let newCleanedArray = [...cleanedArray]

                //Remove duplicates
                cleanedArray.forEach(element => {
                    packageExtraList.forEach(extra => {
                        if (extra.name === element.name) {
                            newCleanedArray = newCleanedArray.filter(object => {
                                return object.name !== extra.name;
                            })
                        }
                    })
                })

                //Check if package is installed using the previous installedList array
                for (let item in newCleanedArray) {
                    for (let package in installedList) {
                        if (installedList[package].name === newCleanedArray[item].name) {
                            newCleanedArray[item].clickable = true
                            break;
                        }
                    }
                }
                packageExtraList.push(...newCleanedArray)
            }

            objectPackage.packageExtras.push(...packageExtraList)
        }

        if (objectList.length != 0) {
            for (let package in objectList) {
                if (objectList[package].name === objectPackage.name) {
                    packageAlreadyInList = true;
                    break;
                }
            }
        }

        if (!packageAlreadyInList) {
            objectList.push(objectPackage)
        }

    }

    objectList.forEach(element1 => {
        objectList.forEach(element2 => {
            element1.packageDependencies.forEach(element1PackageDependency => {
                if (element1PackageDependency.name === element2.name) {
                    element2.reverseDependencies.push(element1.name)
                }
            });
        });
    });
    return objectList;
}
exports.readFile = readFile;