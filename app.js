function Heading(props) {
    return (
      <MaterialUI.Box sx={{ flexGrow: 1, mb: 2 }}>
        <MaterialUI.AppBar position="static">
          <MaterialUI.Toolbar>
            <MaterialUI.Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Particle
            </MaterialUI.Typography>
            <MaterialUI.Button href="https://github.com/scikit-hep/particle" color="inherit">
              Source
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
  
  class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        inputValue: 0,
        outputValue: "",
        err_msg: "",
      };
    }
  
    handleChange = (event) => {
      this.setState({
        inputValue: event.target.value,
      });
    };
  
    handleSubmit = () => {
        pyodide_promise.then((pyodide) => {
          var outputValue;
          try {
            outputValue = pyodide.runPython(`
              import json
              from particle import Particle
              query = Particle.from_pdgid(${this.state.inputValue})
              name = query.name
              mass = query.mass
              width = query.width
              
              output = {
                "name": name,
                "mass": mass,
                "width": width
              }
              json.dumps(output)
            `);
            const output = JSON.parse(outputValue);
            this.setState({
              outputValue: output,
              err_msg: "",
            });
          } catch (e) {
            outputValue = "";
            this.setState({
              err_msg: "Invalid PDG ID. Please try again.",
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
              <MaterialUI.Stack
                direction="row"
                spacing={2}
                alignItems="top"
                sx={{ m: 1, mb: 3 }}
              >
                <MaterialUI.TextField
                  id="pdgid-input"
                  label="PDG ID"
                  helperText="Enter a PDG ID (e.g. -12)"
                  variant="outlined"
                  autoFocus={true}
                  onInput={(e) => this.setState({ inputValue: e.target.value })}
                  sx={{ flexGrow: 3 }}
                />
                <MaterialUI.Button
                  variant="contained"
                  onClick={this.handleSubmit}
                  sx={{ flexGrow: 1 }}
                >
                  Submit
                </MaterialUI.Button>
              </MaterialUI.Stack>
              {this.state.err_msg && (
                <MaterialUI.Box sx={{ m: 1}}>
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
                <MaterialUI.TableContainer component={MaterialUI.Paper}>
                <MaterialUI.Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <MaterialUI.TableHead>
                    <MaterialUI.TableRow>
                      <MaterialUI.TableCell>Name</MaterialUI.TableCell>
                      <MaterialUI.TableCell align="right">Mass&nbsp;(MeV)</MaterialUI.TableCell>
                      <MaterialUI.TableCell align="right">Width</MaterialUI.TableCell>
                    </MaterialUI.TableRow>
                  </MaterialUI.TableHead>
                  <MaterialUI.TableBody>
                     <MaterialUI.TableRow>
                        <MaterialUI.TableCell>{this.state.outputValue.name}</MaterialUI.TableCell>
                        <MaterialUI.TableCell align="right">{this.state.outputValue.mass}</MaterialUI.TableCell>
                        <MaterialUI.TableCell align="right">{this.state.outputValue.width}</MaterialUI.TableCell>
                      </MaterialUI.TableRow>
                  </MaterialUI.TableBody>
                </MaterialUI.Table>
              </MaterialUI.TableContainer>
        )}
            </MaterialUI.Box>
          </MyThemeProvider>
        );
      }
}

  