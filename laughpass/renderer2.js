
const e = React.createElement;

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {k2: '', fragment_id: '', id_token: ''};

    window.ipcRenderer.on("get-company-id", (event, data) => {
      console.log(`Received ${data} from main process`);
      this.setState({"company_id": data})
    });
    window.ipcRenderer.on("get-id-token", (event, data) => {
      console.log(`Received ${data} from main process`);
      this.setState({"id_token": data})

      this.get_k2()
    });

      window.ipcRenderer.send('get-company-id');
    window.ipcRenderer.send('get-id-token');
  }

  get_k2(event){
    const url = "https://accounts.lastpass.com/federatedlogin/api/v1/getkey";
    const data = {"company_id": this.state.company_id, "id_token": this.state.id_token}
    fetch(url, {method:'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)} )
        .then(res => res.json())
        .then(res => { this.setState({k2: res.k2, fragment_id: res.fragment_id});
        window.ipcRenderer.send("fragment-id", res.fragment_id);
        window.ipcRenderer.send("k2", res.k2);
        console.log(this.state)  })
  }

  render() {
    if(this.state.login_link) {
      return (
          <pre>{this.state.k2}</pre>
      );
    } else {
      return (
          <div onLoad={this.get_k2}/>
      );
    }
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(e(NameForm), domContainer);

/*
"k2": "3JykmIVoecext05CwGSQMrd7U408BaiXQMlgpitLO2a7",
"fragment_id": "NOUMy2MwP6UTGU7UIh8e/Rffb+jF+YT+7XH8ajb1Xtw="

 */