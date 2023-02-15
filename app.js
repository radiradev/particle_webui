function ParticleTable(props) {
  return (
    <MaterialUI.TableContainer component={MaterialUI.Paper}>
      <MaterialUI.Table sx={{ minWidth: 650 }} aria-label="particle table">
        <MaterialUI.TableHead>
          <MaterialUI.TableRow>
            <MaterialUI.TableCell>Name</MaterialUI.TableCell>
            <MaterialUI.TableCell align="left">PDG ID</MaterialUI.TableCell>
            <MaterialUI.TableCell align="left">Mass&nbsp;(MeV)</MaterialUI.TableCell>

          </MaterialUI.TableRow>
        </MaterialUI.TableHead>
        <MaterialUI.TableBody>
            {props.queries.slice(0).reverse().map((query, index) => (
              <MaterialUI.TableRow key={index}>
                <MaterialUI.TableCell>{query.output.name}</MaterialUI.TableCell>
                <MaterialUI.TableCell>{query.output.pdg_id}</MaterialUI.TableCell>
                <MaterialUI.TableCell>{query.output.mass}</MaterialUI.TableCell>
              </MaterialUI.TableRow>
          ))}
        </MaterialUI.TableBody>
      </MaterialUI.Table>
    </MaterialUI.TableContainer>
  );
}



function Heading(props) {
  return (
    <MaterialUI.Box sx={{ flexGrow: 1, mb: 2 }}>
      <MaterialUI.AppBar position="static">
        <MaterialUI.Toolbar>
          <MaterialUI.Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Particle
          </MaterialUI.Typography>
          <MaterialUI.Button href="https://github.com/scikit-hep/particle" color='inherit'>
            <MaterialUI.Icon>code</MaterialUI.Icon>
          </MaterialUI.Button>

        </MaterialUI.Toolbar>
      </MaterialUI.AppBar>
    </MaterialUI.Box>
  );
}


async function prepare_pyodide() {
  const pyodide = await loadPyodide();

  await pyodide.loadPackage("micropip");
  await pyodide.runPythonAsync(`
        import micropip
        await micropip.install(["particle==0.21.2"])
    `);
  return pyodide;
}

function MyThemeProvider(props) {
  const prefersDarkMode = MaterialUI.useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      MaterialUI.createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  return (
    <MaterialUI.ThemeProvider theme={theme}>
      {props.children}
    </MaterialUI.ThemeProvider>
  );
}

const pyodide_promise = prepare_pyodide();




// Main App
class App extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      searchMode: "PDG ID",
      menuAnchorEl: null,
      menuOpen: false,
      inputValue: 0,
      outputValue: "",
      err_msg: "",
      queries: [],
    };
  }

  handleChange = (event) => {
    this.setState({
      inputValue: event.target.value,
    });
  };

  handleOpenMenu = (event) => {
    this.setState({
      menuAnchorEl: event.currentTarget,
      menuOpen: true,
    });
  };

  handleCloseMenu = () => {
    this.setState({
      menuAnchorEl: null,
      menuOpen: false,
    });
  };

  handleModeChange = (mode) => () => {
    this.setState({
      searchMode: mode,
      menuOpen: false,
    });
  };

  get helperText() {
    switch (this.state.searchMode) {
      case "PDG ID":
        return "Enter a PDG ID (e.g. -11)";
      case "Name":
        return "Enter a particle name (e.g. e+)";
      default:
        return "";
    }

  }

  
  handleSubmit = () => {
    pyodide_promise.then((pyodide) => {
      var outputValue;
      try {
        outputValue = pyodide.runPython(`
          import json
          from particle import Particle
          mode = "${this.state.searchMode}"

          if mode == "PDG ID":
            query = Particle.from_pdgid("${this.state.inputValue}")
            
          elif mode == "Name":
            query = Particle.from_string("${this.state.inputValue}")

          name = query.latex_name
          pdg_id = query.pdgid
          mass = query.mass
          
          output = {
            "name": name,
            "pdg_id": pdg_id,
            "mass": query.mass,	
          }
          if mass is None:
            output["mass"] = "?"
          json.dumps(output)
        `);
        const output = JSON.parse(outputValue);
        
        this.setState((prevState) => ({
          outputValue: output,
          err_msg: "",
          queries: [
            ...prevState.queries,
            { input: prevState.inputValue, output: output },
          ],
        }));
      } catch (e) {
        outputValue = "";
        this.setState({
          err_msg: "Invalid input. Try again.",
        });
        return;
      }
    });
  };

  
  render() {
    return (
      
      <MyThemeProvider>
        <MaterialUI.CssBaseline />
        <MaterialUI.Box>
       
        
          {this.props.header && <Heading />}
          <MaterialUI.Container
            maxWidth="md"
          >
            <MaterialUI.Stack
              direction="row"
              spacing={2}
              alignItems="top"
              sx={{ m: 1, mb: 3 }}
            >
              <MaterialUI.TextField
                id="pdgid-input"
                label={this.state.searchMode}
                helperText={this.helperText}
                variant="outlined"
                autoFocus={true}
                onInput={(e) => this.setState({ inputValue: e.target.value })}
                sx={{ flexGrow: 3 }}
                InputProps={{
                  startAdornment: (
                    <MaterialUI.InputAdornment position="start">
                      <MaterialUI.IconButton
                        aria-label="menu"
                        onClick={this.handleOpenMenu}
                      >
                        <MaterialUI.Icon>menu</MaterialUI.Icon>
                      </MaterialUI.IconButton>

                    </MaterialUI.InputAdornment>
                  ),
                  endAdornment: (
                    <MaterialUI.InputAdornment position="end">
                      <MaterialUI.IconButton
                        aria-label="search"
                        onClick={this.handleSubmit}
                      >
                        <MaterialUI.Icon>search</MaterialUI.Icon>
                      </MaterialUI.IconButton>
                    </MaterialUI.InputAdornment>
                  ),
                }}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    this.handleSubmit();
                  }
                }}
              >
              </MaterialUI.TextField>
              <MaterialUI.Menu
                id="search-mode-menu"
                anchorEl={this.state.menuAnchorEl}
                keepMounted
                open={this.state.menuOpen}
                onClose={this.handleCloseMenu}
              >
                <MaterialUI.MenuItem onClick={this.handleModeChange("PDG ID")}>
                  PDG ID
                </MaterialUI.MenuItem>
                <MaterialUI.MenuItem onClick={this.handleModeChange("Name")}>
                  Name
                </MaterialUI.MenuItem>
              </MaterialUI.Menu>
            </MaterialUI.Stack>

            {this.state.err_msg && (
              <MaterialUI.Box sx={{ m: 1 }}>
                <MaterialUI.Typography
                  variant="body1"
                  component="div"
                  color="error"
                >
                  {" "}
                  {this.state.err_msg}{" "}
                </MaterialUI.Typography>
              </MaterialUI.Box>
            )}

            {this.state.outputValue && (
              <ParticleTable queries={this.state.queries} />
            )}
          </MaterialUI.Container>
        </MaterialUI.Box>
      </MyThemeProvider>
      
    );
  }
}

