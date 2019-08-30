/* eslint-disable no-plusplus */
/* eslint-disable no-loop-func */
/*
  *DOCUMENTATION

  *NOTES:
  Currently this works for classic version of calculation views.
  Quick check is to see if input nodes use '#' at the beginning. If they do, this will work.
  A fix for different versions will probably eventually be made.
  HANA Studio appears to end at version 2.3, while Web Ide is at version 3.0.

  *Current features...
  - Identify and fix first level split nodes.
    - If split node has nodes beneath, function will have to be reran multiple times.
  - Identify right joins
    - Initial tests seem to work

  *Planned features...
  - Identify unmapped input parameters

*/

const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

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
  fs.readFile(filePath, 'utf8', (err, data) => {
    parser.parseString(data, (err2, result) => {
      cb(null, result);
    });
  });
}
function ParseXML(xml, cb) {
  parser.parseString(xml, (err, res) => {
    cb(null, res);
  });
}

// Get the calculation view schema version. 2.3 maps to Hana 1.0 classic, 3.0 is for HANA 2.0 XSA
function GetCvVersion(jsonResult, cb) {
  const version = jsonResult['Calculation:scenario'].$.schemaVersion;
  if (version === undefined) {
    return cb(Error('No version'));
  }
  return cb(null, version);
}

// Get the root of Calculation View element.
// This contains an array of all calculation view nodes
function GetCvRoot(jsonResult, cb) {
  const cvRoot = jsonResult['Calculation:scenario'].calculationViews[0].calculationView;
  if (cvRoot === undefined) {
    return cb(Error('No calculation view'));
  }
  return cb(null, cvRoot);
}

// Get Local Variable element
// This contains an array of all local variable elements (input parameters)?
function GetLocalVarRoot(jsonResult, cb) {
  const localVarRoot = jsonResult['Calculation:scenario'].localVariables[0].variable;
  if (localVarRoot === undefined) {
    return cb(Error('No local variables'));
  }
  return cb(null, localVarRoot);
}

// Get Variable Map root element
// This contains an array of all mappings of input parameters?
function GetVarMapRoot(jsonResult, cb) {
  const varMapRoot = jsonResult['Calculation:scenario'].variableMappings[0].mapping;
  if (varMapRoot === undefined) {
    return cb(Error('No variable mappings'));
  }
  return cb(null, varMapRoot);
}

// Get Data Sources root element
// This contains the origin of all data sources. Tables, other views, etc.
function GetDataSourcesRoot(jsonResult, cb) {
  const dataSourcesRoot = jsonResult['Calculation:scenario'].dataSources[0].DataSource;
  if (dataSourcesRoot === undefined) {
    return cb(Error('No data sources'));
  }
  return cb(null, dataSourcesRoot);
}

// function GetDataSource(jsonResult, dsName, cb) {
//   GetDataSourcesRoot(jsonResult, (err, root) => {
//     if (dsName.charAt(0) === '#') {
//       dsName = dsName.substr(1);
//     }
//   });
// }
function GetDataSourceNames(jsonResult, cb) {
  const ds = [];
  GetDataSourcesRoot(jsonResult, (err, root) => {
    root.forEach((ele) => {
      ds.push(ele.$.id);
    });
  });
  return cb(null, ds);
}
// function GetDataSourceByName(jsonResult, cb) {}

// Get CalculationView node by name (id)
function GetCvByName(jsonResult, cvName, cb) {
  GetCvRoot(jsonResult, (err, root) => {
    let cvNameParsed = JSON.parse(cvName);
    if (cvNameParsed.charAt(0) === '#') {
      cvNameParsed = cvNameParsed.substr(1);
    }
    for (let i = 0; i < root.length; i++) {
      if (root[i].$.id === cvNameParsed) {
        return cb(root[i]);
      }
    }
    return null;
  });
}
// Get all CalculationView nodes
// Return array
function GetCvs(jsonResult, cb) {
  GetCvRoot(jsonResult, (err, root) => {
    const cvs = [];
    for (let i = 0; i < root.length; i++) {
      cvs.push(root[i]);
    }
    return cb(err, cvs);
  });
}

// Get all Calculation View nodes that have specified input node
//! can probably change this to use the GetCvs function. Just remove elements that don't have match.
//! i made the change
function GetCvsByInput(jsonResult, inputName, cb) {
  let inputNameParsed = JSON.parse(inputName);
  if (inputNameParsed.charAt(0) !== '#') {
    inputNameParsed = `#${inputNameParsed}`;
  }
  const results = [];
  GetCvs(jsonResult, (err, cvs) => {
    cvs.forEach((cv) => {
      cv.input.forEach((input) => {
        if (input.$.node === inputNameParsed && results.indexOf(input) === -1) {
          results.push(cv);
        }
      });
    });
  });
  return cb(null, results);

  // GetCvRoot(jsonResult, (err, root) => {
  //   // let inputNameParsed = JSON.parse(inputName);
  //   // if (inputNameParsed.charAt(0) !== '#') {
  //   //   inputNameParsed = `#${inputNameParsed}`;
  //   // }
  //   const results = [];
  //   // Traverse through all calc view nodes
  //   for (let index = 0; index < root.length; index++) {
  //     // Traverse through all input to the calc view
  //     for (let j = 0; j < root[index].input.length; j++) {
  //       const element = root[index].input[j];
  //       const inp = element.$.node;
  //       // If the input node name matches the desired input node, add to result
  //       if (inp === inputNameParsed) {
  //         if (results.indexOf(root[index]) === -1) {
  //           results.push(root[index]);
  //         }
  //       }
  //     }
  //   }
  //   return cb(null, results);
  // });
}
// Go through all Calculation View nodes and count how many times each input node is used
// This will determine whether a split nodes occur
//! check if this is comparing with data sources. data sources can occur multiple times.
function GetCvInputNodeCounts(jsonResult, cb) {
  GetCvs(jsonResult, (err, cvs) => {
    const inputNodes = {};
    cvs.forEach((ele1) => {
      ele1.input.forEach((ele2) => {
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
function GetCvInputsByInput(jsonResult, inputName, cb) {
  let inputNameParsed = inputName;
  if (inputNameParsed.charAt(0) === '"') {
    inputNameParsed = inputNameParsed.slice(1, -1);
  }
  const inputs = [];
  GetCvs(jsonResult, (err, cvs) => {
    cvs.forEach((cv) => {
      cv.input.forEach((input) => {
        if (input.$.node === inputNameParsed) {
          inputs.push(input);
        }
      });
    });
  });
  // console.log(inputs);
  return cb(null, inputs);

  // GetCvsByInput(jsonResult, inputName, (err, cvs) => {
  //   // let inputNameParsed = inputName;
  //   // if (inputNameParsed.charAt(0) === '"') {
  //   //   inputNameParsed = inputNameParsed.slice(1, -1);
  //   // }
  //   cvs.forEach((cv) => {
  //     cv.input.forEach((input) => {
  //       // if (inputName.charAt(0) === '"') {
  //       //   inputName = inputName.slice(1, -1);
  //       // }
  //       if (input.$.node === inputNameParsed) {
  //         inputs.push(input);
  //       }
  //     });
  //   });
  //   return cb(null, inputs);
  // });
}

// Find all input nodes that are used in more than 1 calc view node
// And remove any datasources
function GetSplitNodes(jsonResult, cb) {
  const splitNodes = {};
  GetDataSourceNames(jsonResult, (err2, ds) => {
    GetCvInputNodeCounts(jsonResult, (err, inputNodes) => {
      Object.keys(inputNodes).forEach((key) => {
        if (inputNodes[key] > 1) {
          let keyParsed = JSON.parse(key);
          keyParsed = keyParsed.replace('#', '');
          if (!ds.includes(keyParsed)) {
            splitNodes[key] = inputNodes[key];
          }
        }
      });
    });
  });
  return cb(null, splitNodes);
}

// Duplicate calc view node and return the copy. Does not add to structure.
function CopyCv(jsonResult, cvName, cb) {
  GetCvByName(jsonResult, cvName, (cv) => {
    // duplicate cv into another cv and add it to the root
    const cvCopy = JSON.parse(JSON.stringify(cv));
    return cb(cvCopy);
  });
}

function GetRightJoinCvs(jsonResult, cb) {
  GetCvs(jsonResult, (err, cvs) => {
    const rightOuters = [];
    cvs.forEach((ele) => {
      if (ele.$.joinType === 'rightOuter') {
        rightOuters.push(ele);
      }
    });
    return cb(null, rightOuters);
  });
}

// collect all in localVariables section
// param = true?
// check all variable mappings
// if all localVariables are a targetVariable for at least 1 mapping, all input parameters are mapped.
function GetUnmappedParams(jsonResult, cb) {
  // const localVarRoot = GetLocalVarRoot(jsonResult);
  // const varMapRoot = GetVarMapRoot(jsonResult);
  const vars = [];
  const maps = [];
  GetLocalVarRoot(jsonResult, (err, localVarRoot) => {
    if (err) {
      // console.log(err);
      return cb(err);
    }
    GetVarMapRoot(jsonResult, (err, varMapRoot) => {
      if (err) {
        // console.log(err);
        return cb(err);
      }
      localVarRoot.forEach((ele) => {
        vars.push(ele.$.id);
      });
      varMapRoot.forEach((ele) => {
        const tempName = JSON.stringify(ele.targetVariable[0].$.name);
        maps.push(JSON.parse(tempName));
      });
      const unmapped = vars.filter(el => !maps.includes(el));
      return cb(null, unmapped);
    });
    return null;
  });
}

function FixRightJoins(jsonResult, cb) {
  GetRightJoinCvs(jsonResult, (err, rightOuters) => {
    rightOuters.forEach((ele) => {
      ele.$.joinType = 'leftOuter';
      [ele.input[0], ele.input[1]] = [ele.input[1], ele.input[0]];
    });
    return cb(null, rightOuters);
  });
}

// need to check if split node is a data source
// if it is a data source than it is allowed to be in multiple places
function FixSplitNodes(jsonResult, version, cb) {
  // const cvRoot = GetCvRoot(jsonResult);
  GetCvRoot(jsonResult, (err, cvRoot) => {
    let complete = false;
    const allSplits = [];
    while (!complete) {
      // Get input nodes that are used by more than 1 node
      GetSplitNodes(jsonResult, (err, splitNodes) => {
        if (Object.keys(splitNodes).length === 0) {
          complete = true;
        } else {
          allSplits.push(splitNodes);
          Object.keys(splitNodes).forEach((key) => {
            // Get the calc view nodes based on the name of split inputs
            GetCvInputsByInput(jsonResult, key, (err2, inputNodes) => {
              for (let i = 0; i < splitNodes[key] - 1; i++) {
                // Make a copy for each split (if used in 10 places, create 9 new)
                CopyCv(jsonResult, key, (cvCopy) => {
                  const cvCopyNew = cvCopy;
                  // Change the copies id to new id (_i for iteration)
                  cvCopyNew.$.id = `${cvCopyNew.$.id}_${i + 1}`;
                  // Add copy to the structure
                  cvRoot.push(cvCopyNew);
                  // Change input node to the newly created calc view node
                  if (version <= 2.3) {
                    inputNodes[i].$.node = `#${cvCopyNew.$.id}`;
                  } else {
                    inputNodes[i].$.node = `${cvCopyNew.$.id}`;
                  }
                });
              }
            });
          });
        }
      });
    }
    return cb(null, allSplits);
  });
}

function ProcessView(filePath, cb) {
  const res = {};
  const checks = [];
  ParseFile(filePath, (err, json) => {
    GetCvVersion(json, (err, version) => {
      res.version = version;
      GetSplitNodes(json, (err, splits) => {
        checks.push({ splitNodes: splits });
        // res.splitNodes = splits;
        GetRightJoinCvs(json, (err, rJoins) => {
          checks.push({ rightJoins: rJoins });
          // res.rightJoins = rightJoins;
          res.checks = checks;
          return cb(null, res);
        });
      });
    });
  });
}

function FixView(filePath, cb) {
  ParseFile(filePath, (err, parsedJSON) => {
    GetCvVersion(parsedJSON, (err, cvVersion) => {
      FixSplitNodes(parsedJSON, cvVersion, (err, splitNodes) => {
        FixRightJoins(parsedJSON, (err, rightJoins) => {
          const builder = new xml2js.Builder();
          const xml = builder.buildObject(parsedJSON);
          return cb(null, xml);
        });
      });
    });
  });
}

function Test() {
  const filePath = path.join(`${__dirname}`, '..', 'data', 'xml', 'employeespunchedin.xml');
  // const filePath = path.join(`${__dirname}`, `..`, `data`, `xml`, `cv_bad.xml`);
  // const filePath = path.join(`${__dirname}`, `..`, `data`, `xml`, `cv_bad2.xml`);

  ParseFile(filePath, (err, result) => {
    console.log('Processing...');
    // WriteFile('cv_json_new.json', JSON.stringify(result));
    // console.log('complete');

    // return;

    GetCvVersion(result, (err, version) => {
      console.log('Version: ', version);
      FixSplitNodes(result, version, (err, splitNodes) => {
        // if (err) console.error(err);
        GetDataSourceNames(result, (err, res) => {
          console.log('Data Sources:', res);
        });
        console.log('Split Nodes:', splitNodes);
      });
      // return;
      FixRightJoins(result, (err, rightOuters) => {
        // if (err) console.error(err);
        console.log('Right Outer Joins:', rightOuters.length);
      });
      // return;
      // GetUnmappedParams(result, (err, unmapped) => {
      //   // if (err) console.error(err);
      //   console.log('Unmapped parameters:', unmapped);
      // });

      console.log('\nWriting files...');
      // WriteFile('./data/json/cv_json_latest.json', JSON.stringify(result));
      const builder = new xml2js.Builder();
      const xml = builder.buildObject(result);
      WriteFile('./data/xml/cv_xml_latest.xml', xml);
    });
  });
}
module.exports = {
  Test,
  ProcessView,
  FixView,
  ParseFile,
  ParseXML,
  GetCvVersion,
  GetRightJoinCvs,
  FixRightJoins,
  GetSplitNodes,
  FixSplitNodes,
};
