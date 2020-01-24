//! NOTES
// Get Roots seem to be the same as getting their respective element arrays

const fs = require("fs");
const xml2js = require("xml2js");
const path = require("path");

const parser = new xml2js.Parser();

function WriteFile(fileName, text) {
  fs.writeFileSync(fileName, text);
}
/**
 *
 * @param {string} filePath
 * @param {*} (err, res)
 */
function ParseFile(filePath, cb) {
  fs.readFile(filePath, "utf8", (err, data) => {
    parser.parseString(data, (err2, result) => {
      WriteFile(
        "./data/json/cv_json_latest.json",
        JSON.stringify(result, null, 4)
      );
      cb(null, result);
    });
  });
}
function ParseXML(xml, cb) {
  parser.parseString(xml, (err, res) => {
    cb(null, res);
  });
}

function GetCvheaderInfo(jsonResult, cb) {
  const version = jsonResult["Calculation:scenario"].$.schemaVersion;
  const { id } = jsonResult["Calculation:scenario"].$;
  const info = { version, id };
  if (version === undefined) {
    return cb(Error("No version"));
  }
  if (id === undefined) {
    return cb(Error("No id"));
  }
  return cb(null, info);
}

// Get the root of Calculation View element.
// This contains an array of all calculation view nodes
function GetNodeRoot(jsonResult, cb) {
  const cvRoot =
    jsonResult["Calculation:scenario"].calculationViews[0].calculationView;
  if (cvRoot === undefined) {
    return cb(Error("No calculation view"));
  }
  return cb(null, cvRoot);
}

// Get Local Variable element
// This contains an array of all local variable elements (input parameters)?
function GetLocalVarRoot(jsonResult, cb) {
  // console.log('TEST')
  const localVarRoot =
    jsonResult["Calculation:scenario"].localVariables[0].variable;
  // console.log('INFO', localVarRoot);
  if (localVarRoot === undefined) {
    return cb(null, []);
    // return cb(Error('No local variables'));
  }
  return cb(null, localVarRoot);
}

function GetHintRoot(jsonResult, cb) {
  const hintRoot = jsonResult["Calculation:scenario"].executionHints;
  if (hintRoot === undefined) {
    return cb(null, []);
  }
  return cb(null, hintRoot);
}

function GetLocalVars(jsonResult, cb) {
  const localVars = [];
  GetLocalVarRoot(jsonResult, (err, localVarRoot) => {
    if (err) {
      return cb(err);
    }
    if (localVarRoot.length === 0) {
      return cb(null, localVars);
    }
    localVarRoot.forEach(ele => {
      localVars.push(ele);
    });
  });
  return cb(null, localVars);
}
function GetLocalVarNames(jsonResult, cb) {
  const localVarNames = [];
  GetLocalVars(jsonResult, (err, localVars) => {
    if (err) {
      return cb(err);
    }
    localVars.forEach(ele => {
      localVarNames.push(ele.$.id);
    });
  });
  return cb(null, localVarNames);
}

// Get Variable Map root element
// This contains an array of all mappings of input parameters?
function GetVarMapRoot(jsonResult, cb) {
  const varMapRoot =
    jsonResult["Calculation:scenario"].variableMappings[0].mapping;
  if (varMapRoot === undefined) {
    return cb(null, []);
    // return cb(Error('No variable mappings'));
  }
  return cb(null, varMapRoot);
}

function GetVarMaps(jsonResult, cb) {
  const varMaps = [];
  GetVarMapRoot(jsonResult, (err, varMapRoot) => {
    if (err) {
      return cb(err);
    }
    varMapRoot.forEach(ele => {
      varMaps.push(ele);
    });
  });
  return cb(null, varMaps);
}

function GetVarMapLocalTarget(jsonResult, cb) {
  const localTarget = [];
  GetVarMaps(jsonResult, (err, varMaps) => {
    if (err) {
      return cb(err);
    }
    varMaps.forEach(ele => {
      const data = {
        local: ele.localVariable[0],
        target: ele.targetVariable[0].$.name
      };
      localTarget.push(data);
    });
  });
  return cb(null, localTarget);
}

// Get Data Sources root element.
// This contains the origin of all data sources. Tables, other views, etc.
function GetDataSourceRoot(jsonResult, cb) {
  const dataSourcesRoot =
    jsonResult["Calculation:scenario"].dataSources[0].DataSource;
  if (dataSourcesRoot === undefined) {
    return cb(Error("No data sources"));
  }
  return cb(null, dataSourcesRoot);
}

function GetDataSources(jsonResult, cb) {
  const dataSources = [];
  GetDataSourceRoot(jsonResult, (err, root) => {
    root.forEach(ds => {
      dataSources.push(ds);
    });
  });
  return cb(null, dataSources);
}

function GetDataSourceNames(jsonResult, cb) {
  const dataSourceNames = [];
  GetDataSources(jsonResult, (err, dataSources) => {
    dataSources.forEach(ds => {
      dataSourceNames.push(ds.$.id);
    });
  });
  return cb(null, dataSourceNames);
}

// Get CalculationView node by name (id)
function GetNodeByName(jsonResult, cvName, cb) {
  GetNodeRoot(jsonResult, (err, root) => {
    let cvNameParsed = JSON.parse(cvName);
    if (cvNameParsed.charAt(0) === "#") {
      cvNameParsed = cvNameParsed.substr(1);
    }
    for (let i = 0; i < root.length; i += 1) {
      if (root[i].$.id === cvNameParsed) {
        return cb(root[i]);
      }
    }
    return null;
  });
}

// Get all CalculationView nodes
// Return array
function GetNodes(jsonResult, cb) {
  GetNodeRoot(jsonResult, (err, root) => {
    const cvs = [];
    for (let i = 0; i < root.length; i += 1) {
      cvs.push(root[i]);
    }
    return cb(err, cvs);
  });
}

// Get all Calculation View nodes that have specified input node
//! can probably change this to use the GetCvs function. Just remove elements that don't have match.
//! i made the change
function GetNodesByInput(jsonResult, inputName, cb) {
  let inputNameParsed = JSON.parse(inputName);
  if (inputNameParsed.charAt(0) !== "#") {
    inputNameParsed = `#${inputNameParsed}`;
  }
  const results = [];
  GetNodes(jsonResult, (err, cvs) => {
    cvs.forEach(cv => {
      cv.input.forEach(input => {
        if (input.$.node === inputNameParsed && results.indexOf(input) === -1) {
          results.push(cv);
        }
      });
    });
  });
  return cb(null, results);
}

// Get all filter expressions that occur in all nodes
function GetFilterExpressions(jsonResult, cb) {
  const filterExpressions = [];
  GetNodes(jsonResult, (err, nodes) => {
    nodes.forEach(node => {
      if (node.filter !== undefined) filterExpressions.push(node.filter[0]);
    });
  });
  return cb(null, filterExpressions);
}

// Go through all Calculation View nodes and count how many times each input node is used
// This will determine whether a split nodes occur
//! check if this is comparing with data sources. data sources can occur multiple times.
function GetInputNodeCounts(jsonResult, cb) {
  GetNodes(jsonResult, (err, cvs) => {
    const inputNodes = {};
    cvs.forEach(ele1 => {
      ele1.input.forEach(ele2 => {
        const inputNode = JSON.stringify(ele2.$.node);
        if (inputNode in inputNodes) {
          inputNodes[inputNode] += 1;
        } else {
          inputNodes[inputNode] = 1;
        }
      });
    });
    return cb(null, inputNodes);
  });
}

// Return array of input nodes
//! figure out what this does exactly
// Get all Calculation View Inputs based on an input name
// Used to change mappings to newly created nodes.
function GetInputs(jsonResult, inputName, cb) {
  let inputNameParsed = inputName;
  if (inputNameParsed.charAt(0) === '"') {
    inputNameParsed = inputNameParsed.slice(1, -1);
  }
  const inputs = [];
  GetNodes(jsonResult, (err, cvs) => {
    cvs.forEach(cv => {
      cv.input.forEach(input => {
        if (input.$.node === inputNameParsed) {
          inputs.push(input);
        }
      });
    });
  });
  // console.log(inputs);
  return cb(null, inputs);
}

// Duplicate calc view node and return the copy. Does not add to structure.
function CopyCv(jsonResult, cvName, cb) {
  GetNodeByName(jsonResult, cvName, cv => {
    // duplicate cv into another cv and add it to the root
    const cvCopy = JSON.parse(JSON.stringify(cv));
    return cb(cvCopy);
  });
}

// Create Name for Input Node depending on version of calculation view.
function CreateInputName(nodeName, version, cb) {
  let newName = "";
  if (version <= 2.3) {
    newName = `#${nodeName}`;
    // return (null,`#${cvCopyNew.$.id}`);
  } else {
    newName = `${nodeName}`;
    // return null`${cvCopyNew.$.id}`;
  }
  return cb(null, newName);
}

function GetCalculatedColumns(jsonResult, cb) {
  const calcColumns = [];
  GetNodes(jsonResult, (err, nodes) => {
    nodes.forEach(element => {
      if (element.calculatedViewAttributes[0] !== "") {
        const calcAtts =
          element.calculatedViewAttributes[0].calculatedViewAttribute;
        calcAtts.forEach(col => {
          calcColumns.push(col);
        });
      }
    });
  });
  return cb(null, calcColumns);
}
function GetCalculatedColumnNames(jsonResult, cb) {
  const calcColumnNames = [];
  GetCalculatedColumns(jsonResult, (err, calcColumns) => {
    if (err) {
      return cb(Error("Error at GetCalculatedColumns"));
    }
    calcColumns.forEach(element => {
      calcColumnNames.push(element.$.id);
    });
  });
  return cb(null, calcColumnNames);
}
function GetCalculatedColumnFormulas(jsonResult, cb) {
  const formulas = [];
  GetCalculatedColumns(jsonResult, (err, calcColumns) => {
    if (err) {
      return cb(err);
    }
    calcColumns.forEach(element => {
      formulas.push(element.formula[0]);
    });
  });
  return cb(null, formulas);
}
function GetUnmappedParameters(jsonResult, cb) {
  let unmapped = [];
  GetLocalVarNames(jsonResult, (err, localVarNames) => {
    // console.log('GetLocalVarNames:', localVarNames);
    GetVarMapLocalTarget(jsonResult, (err, varMaps) => {
      // console.log('GetVarMapLocalTarget:', varMaps);
      const exists = [];
      varMaps.forEach(map => {
        exists.push(map.local);
      });
      unmapped = localVarNames.filter(x => !exists.includes(x));
      GetCalculatedColumnFormulas(jsonResult, (err, formulas) => {
        GetFilterExpressions(jsonResult, (err, filters) => {
          const toRemove = [];
          //! optimization here. break out of for loop when found
          unmapped.forEach(unmap => {
            // console.log('Searching unmapped:', unmap);
            for (let i = 0; i < filters.length; i += 1) {
              if (filters[i].includes(unmap)) {
                toRemove.push(unmapped.indexOf(unmap));
                // break;
              }
            }
            for (let i = 0; i < formulas.length; i += 1) {
              if (formulas[i].includes(unmap)) {
                toRemove.push(unmapped.indexOf(unmap));
                // break;
              }
            }
            toRemove.forEach(removal => {
              unmapped.splice(removal, 1);
            });
          });
        });
      });
    });
  });
  return cb(null, unmapped);
}

function GetCalcColumnsInFilter(jsonResult, cb) {
  const calcColumnsInFilter = [];
  GetCalculatedColumnNames(jsonResult, (err, calcColumns) => {
    if (err) {
      return cb(err);
    }
    GetFilterExpressions(jsonResult, (err, filters) => {
      if (err) {
        return cb(err);
      }
      filters.forEach(filter => {
        // console.log(filter);
        calcColumns.forEach(col => {
          // console.log('Filter:', filter, 'Column:', col);
          if (filter.includes(col)) {
            calcColumnsInFilter.push(col);
          }
        });
      });
    });
  });
  return cb(null, calcColumnsInFilter);
}
function GetRightJoinCvs(jsonResult, cb) {
  GetNodes(jsonResult, (err, cvs) => {
    const rightOuters = [];
    cvs.forEach(ele => {
      if (ele.$.joinType === "rightOuter") {
        rightOuters.push(ele);
      }
    });
    return cb(null, rightOuters);
    // return cb(null, { rightOuters, found: rightOuters.length > 0 });
  });
}

function GetSplitNodes(jsonResult, cb) {
  const splitNodes = {};
  GetDataSourceNames(jsonResult, (err2, ds) => {
    GetInputNodeCounts(jsonResult, (err, inputNodes) => {
      Object.keys(inputNodes).forEach(key => {
        if (inputNodes[key] > 1) {
          let keyParsed = JSON.parse(key);
          keyParsed = keyParsed.replace("#", "");
          if (!ds.includes(keyParsed)) {
            splitNodes[key] = inputNodes[key];
          }
        }
      });
    });
  });
  return cb(null, splitNodes);
}
// There doesn't seem to be a single join formula.
// Need to figure out how to get it
function GetJoinFormulas(jsonResult, cb) {
  const joinFormulas = [];
  return cb(null, joinFormulas);
}
// Once I get the join formulas, this is mostly just a string check against a list of values
function GetCalculatedColumnsInJoin(jsonResult, cb) {
  const calcColumns = [];

  return cb(null, calcColumns);
}

function GetHints(jsonResult, cb) {
  const hints = [];
  GetHintRoot(jsonResult, (err, hintRoot) => {
    if (hintRoot === []) {
      return cb(null, hints);
    } else {
      hintRoot.forEach(hint => {
        hints.push(`HINT: ${hint.$.name} VALUE: ${hint.$.value}`)
      });
      console.log(hintRoot);
    }
  })
  return cb(null, hints);
}

function Test() {
  //   const filePath = path.join(`${__dirname}`, '..', 'data', 'xml', 'employeespunchedin.xml');
  const filePath = path.join(
    `${__dirname}`,
    "..",
    "data",
    "xml",
    "samples",
    "cv_hints.xml"
  );
  // const filePath = path.join(`${__dirname}`, `..`, `data`, `xml`, `cv_bad2.xml`);
  ParseFile(filePath, (err, jsonRes) => {
    WriteFile(
      "./data/json/cv_json_latest.json",
      JSON.stringify(jsonRes, null, 4)
    );
    GetHints(jsonRes, (err, res) => { });
    // GetDataSourceNames(jsonRes, (err, res) => {
    //   console.log(res);
    // });
    // GetCalcColumnsInFilter(jsonRes, (err, res) => {
    //   if (err) {
    //     console.error(err);
    //   }
    //   // console.log('RES\n', res);
    // });
    // GetCalculatedColumns(jsonRes, (err, res) => {});
  });
}
// Test();


module.exports = {
  GetCvheaderInfo,
  CopyCv,
  CreateInputName,
  GetDataSourceNames,
  GetDataSourceRoot,
  GetInputNodeCounts,
  GetInputs,
  GetLocalVarRoot,
  GetNodeByName,
  GetNodeRoot,
  GetNodes,
  GetNodesByInput,
  GetVarMapRoot,
  ParseFile,
  ParseXML,
  WriteFile,
  GetCalculatedColumns,
  GetFilterExpressions,
  GetCalcColumnsInFilter,
  GetRightJoinCvs,
  GetSplitNodes,
  GetUnmappedParameters,
  GetHints
};
