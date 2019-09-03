import React, { useState } from "react";
import "./App.css";
import MyCvParse from "./components/MyCvParse";
import MyBar from "./components/MyBar";
import MyDrawer from "./components/MyDrawer";
import { Route, Switch } from "react-router-dom";
import MyHome from "./components/MyHome";

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div className="App">
      <MyBar
        setDrawerOpen={open => setDrawerOpen(open)}
        title={"Title"}
      ></MyBar>
      <MyDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={open => setDrawerOpen(open)}
      ></MyDrawer>
      <Switch>
        <Route exact path="/" component={MyHome} />
        <Route path="/cvoptimizer" component={MyCvParse} />
      </Switch>

      {/* <MyCvParse /> */}
    </div>
  );
}
