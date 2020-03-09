const nodeUtils = require("./cv_node_utils");

function GetRightJoinCvs(cvJson, cb) {
    nodeUtils.GetNodes(cvJson, (err, cvs) => {
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
function CheckRightJoins(cvJson, cb) {
    GetRightJoinCvs(cvJson, (err, data) => {
        if (err) {
            return cb(err);
        }
        return cb(null, { data, found: data.length > 0 });
    });
}
function FixRightJoins(jsonResult, cb) {
    CheckRightJoinCvs(jsonResult, (err, rightRes) => {
        rightRes.rightOuters.forEach(ele => {
            ele.$.joinType = "leftOuter";
            [ele.input[0], ele.input[1]] = [ele.input[1], ele.input[0]];
        });
        return cb(null, rightRes.rightOuters);
    });
}
module.exports = {
    CheckRightJoins,
    FixRightJoins
};