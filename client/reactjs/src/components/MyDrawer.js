import Drawer from "@material-ui/core/Drawer";
import React, { useState } from "react";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import { Link } from "react-router-dom";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Collapse from "@material-ui/core/Collapse";
import Button from "@material-ui/core/Button";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));

export default function MyDrawer(props) {
  const classes = useStyles();
  //   const [open, setOpen] = useState(true);

  const [expanded, setExpanded] = useState({});
  const tools = ["cvoptimizer"];

  //   const expandButton = name => {
  //     if (expanded.includes(name)) {
  //       let expandedNew = [...expanded];
  //       expandedNew.splice(expanded.indexOf(name), 1);
  //       setExpanded(expandedNew);
  //     } else {
  //       let expandedNew = [...expanded];
  //       expandedNew.push(name);
  //       setExpanded(expandedNew);
  //     }
  //   };
  const expandButton = name => {
    if (name in expanded) {
      let expandedNew = JSON.parse(JSON.stringify(expanded));
      delete expandedNew.name;
      setExpanded(expandedNew);
    } else {
      let expandedNew = JSON.parse(JSON.stringify(expanded));
      expandedNew.name = true;
      setExpanded(expandedNew);
    }
  };

  const drawerList = () => (
    <div>
      <List>
        <ListItem>
          <ExpansionPanel>
            <ExpansionPanelSummary>
              <Link to="tools/cvoptimizer/">Calculation View Optimizer</Link>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>Test1</ExpansionPanelDetails>
          </ExpansionPanel>
        </ListItem>
        <ListItem>
          <Button onClick>Tools</Button>
          <Collapse in={true} timeout="auto">
            <List>
              <ListItem>
                <Link to="/">Home</Link>
              </ListItem>
              <ListItem>
                <p>Test again</p>
              </ListItem>
            </List>
          </Collapse>
        </ListItem>
      </List>
    </div>
  );

  return (
    <div className={classes.root}>
      <Drawer
        open={props.drawerOpen}
        onClose={() => props.setDrawerOpen(false)}
      >
        {drawerList()}
      </Drawer>
    </div>
  );
}
