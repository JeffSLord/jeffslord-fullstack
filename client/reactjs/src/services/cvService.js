import firebase from 'firebase';
const util = require("util");


function CheckFile(files, cb) {
    const API = process.env.API;
    var results = {};

    if (files !== undefined) {
        if (files.length > 0) {
            let res = [];
            let data = new FormData();
            for (const f in files) {
                data.append("files", files[f]);
            }
            if (firebase.auth().currentUser) {
                firebase.auth().currentUser.getIdToken(true)
                    .then((idToken) => {
                        fetch(`${process.env.REACT_APP_API}/api/cv/analyzeManyFiles`, {
                            method: "post",
                            body: data,
                            headers: new Headers({
                                'token': `${idToken}`,
                                'claim': 'cv'
                            })
                        })
                            .then(res => res.json())
                            .then(data => {
                                return cb(null, data);
                            });
                    })
                    .catch((error) => {
                        throw error;
                    })
            } else {
                console.error("User not logged in.");
            }
            return cb(null, res);
        }
    }
}
function FixView(files, title, cb) {
    if (files.length > 0) {
        let data = new FormData();
        data.append("file", files[0]);
        if (firebase.auth().currentUser) {
            firebase.auth().currentUser.getIdToken(true).then((idToken) => {
                fetch(`${process.env.REACT_APP_API}/api/cv/fixSingleFile`, {
                    method: "post",
                    body: data
                })
                    .then(res => res.json())
                    .then(data => {
                        let data2 = {
                            xml: data,
                            title: title
                        }
                        fetch(`${process.env.REACT_APP_API}/api/cv/makeXML`, {
                            method: "post",
                            body: JSON.stringify(data2),
                            headers: new Headers({
                                // "Content-Type": "'text/javascript'",
                                "Content-Type": "application/json",
                                'token': `${idToken}`,
                                'claim': 'cv'
                            })
                        })
                            .then(res => res.json())
                            .then(json => {
                                fetch(`${process.env.REACT_APP_API}/api/cv/downloadXML/${title}`, {
                                    method: "get",
                                    headers: new Headers({
                                        'token': `${idToken}`,
                                        'claim': 'cv'
                                    })
                                })
                            })

                        // .then(res => res.blob())
                        // .then(blob => URL.createObjectURL(blob))
                        // .then(url => {
                        //     window.open(url, '_blank');
                        //     URL.revokeObjectURL(url);
                        // })
                        // return cb(null, data);
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
            )
        }
    }
}
// const Fixbutton = () => {
//   if (files.length > 0) {
//     let data = new FormData();
//     data.append("file", files[0]);
//     setLoading(true);
//     fetch("http://cv_api.jeffslord.com/api/cv/fixSingleFile", {
//       method: "post",
//       body: data
//     })
//       .then(res => res.json())
//       .then(data => {
//         // console.log("xml", data["xml"]);
//         setLoading(false);
//         setXmlResult(data["xml"]);
//       });
//     return;
//   }
// };
export {
    CheckFile,
    FixView
};