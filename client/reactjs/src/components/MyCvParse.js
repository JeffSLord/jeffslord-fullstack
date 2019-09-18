import React, { useState, useEffect } from "react";
import MyFileUploader from "./MyFileUploader";
import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
// import { log } from "util";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import CircularProgress from "@material-ui/core/CircularProgress";
import MyCheckTable from "../components/MyCheckTable";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    margin: "20px",
    textAlign: "center",
    color: theme.palette.text.secondary
  }
}));

export default function MyCvParse() {
  const classes = useStyles();

  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  // const [checks, setChecks] = useState(["version", "rightJoins", "splitNodes"]);
  const [xmlResult, setXmlResult] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Jeff - Calculation View Optimizer";
  });

  const AnalyzeButton = () => {
    if (files.length > 0) {
      console.log("FILES", files);

      let data = new FormData();
      for (const f in files) {
        data.append("files", files[f]);
        console.log(f);
      }
      console.log(data);

      // data.append("files", files);
      fetch("http://localhost:5000/api/cv/analyzeMany", {
        method: "post",
        body: data
      })
        .then(res => res.json())
        .then(data => {
          // console.log("res.json", data);
          setResults(data);
        });
      return;
    }
  };
  const Fixbutton = () => {
    if (files.length > 0) {
      let data = new FormData();
      data.append("file", files[0]);
      setLoading(true);
      fetch("http://localhost:5000/api/cv/fixSingle", {
        method: "post",
        body: data
      })
        .then(res => res.json())
        .then(data => {
          // console.log("xml", data["xml"]);
          setLoading(false);
          setXmlResult(data["xml"]);
        });
      return;
    }
  };

  const RenderCheckTable = singleViewChecks => {
    if (results.length > 0) {
      // change this when multiple working at a time
      singleViewChecks = results[0];
      // end change
      let rows = [];
      singleViewChecks.checks.forEach(check => {
        rows.push({
          check: check["checkName"],
          found: check["found"].toString()
        });
      });
      console.log(rows);

      //
      let tableData = {
        cvName: singleViewChecks.header.id,
        cvVersion: singleViewChecks.header.version,
        columns: [
          { title: "Check", field: "check" },
          {
            title: "Found",
            field: "found",
            cellStyle: rowData => ({
              backgroundColor: rowData === "true" ? "#e57373" : "#a5d6a7"
            })
          }
        ],
        data: rows,
        options: {
          selection: true,
          selectionProps: rowData => ({
            disabled: rowData.found === "false",
            color: "primary"
          })
          // rowStyle: rowData => ({
          //   backgroundColor: rowData.found === "Yes" ? "#e57373" : "#a5d6a7"
          // })
        },
        actions: [
          {
            tooltip: "Fix checked",
            icon: "check",
            onClick: (evt, data) => {
              console.log(evt, data);
            }
          }
        ]
      };
      return <MyCheckTable tableState={tableData}></MyCheckTable>;
    }
  };

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={0}>
        <Grid item xs={12}>
          <Paper className={classes.paper} elevation={5}>
            <Typography variant={"h4"}>Instructions</Typography>
            <Typography variant={"body1"}>
              Upload a file, click process, check for red boxes, press fix, copy
              text, paste into calculation view, run auto format.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs>
          <Paper className={classes.paper} elevation={5}>
            <Grid item>
              <MyFileUploader setparentfiles={files => setFiles(files)} />
            </Grid>
            <Grid item>
              <Button
                size="large"
                fullWidth
                variant={"contained"}
                files={files}
                onClick={() => AnalyzeButton()}
                color="primary"
              >
                Process
              </Button>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs>
          <Paper className={classes.paper} elevation={5}>
            <Grid container justify="center">
              <Grid item>
                <List>
                  <ListItem>{RenderCheckTable([])}</ListItem>
                  <ListItem>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => Fixbutton()}
                      color="primary"
                    >
                      Fix All
                    </Button>
                    {loading && <CircularProgress></CircularProgress>}
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper className={classes.paper} elevation={5}>
            <Grid item xs={12}>
              <Button variant="contained">Download (not working yet)</Button>
            </Grid>
            <TextField
              multiline={true}
              value={xmlResult}
              rowsMax={Infinity}
              fullWidth
            ></TextField>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
