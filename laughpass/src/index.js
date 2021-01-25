import React from 'react'
import ReactDOM from 'react-dom'

const e = React.createElement;
const { ipcRenderer } = window.require('electron');

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      last_checked_email: false,
      email: '',
      lastpass: {},
      oidc: {},
      login_link: false,
      company_id: false,
      id_token: false,
      k2: false,
      fragment_id: false,
      stage: 0
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    ipcRenderer.on("get-stage", (event, data) => {
      console.log(`Received stage ${data} from main process`);
      this.setState({"stage": data})
    });

    ipcRenderer.on("get-email", (event, data) => {
      console.log(`Received ${data} from main process`);
      if(data) {
        this.setState({"email": data})
      }
    });

    ipcRenderer.on("get-company-id", (event, data) => {
      this.setState({"company_id": data})
      this.get_k2()
    });

    ipcRenderer.on("get-id-token", (event, data) => {
      this.setState({"id_token": data})
      this.get_k2()
    });

    ipcRenderer.on('query-email', (event, data) => {
      this.setState({"lastpass": data})
      if (this.state.lastpass.type > 0) {
        this.begin_login()
      }
    })

    ipcRenderer.on('query-oidc', (event, data) => {
      this.setState({"oidc": data})
        this.continue_login()
    })

  }

  create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c==='x' ? r :((r&0x3)|0x8)).toString(16);
    });
    return uuid;
  }

  random() {
    return this.create_UUID().replace(/-/g, '');
  }

  continue_login() {
    let redirect_uri = 'https://accounts.lastpass.com/federated/oidcredirect.html'
    let client_id = this.state.lastpass.OpenIDConnectClientId
    let response_type = 'id_token token'
    let scope = 'openid email profile'
    let state = this.random() // can't find where the real state comes from
    let nonce = this.random()
    let login_hint = this.state.email.split("@")[0]
    let login_url = this.state.oidc.authorization_endpoint +
        '?client_id=' + client_id +
        '&redirect_uri=' + redirect_uri +
        '&response_type=' + response_type +
        '&scope=' + scope +
        '&state=' + state +
        '&nonce=' + nonce +
        '&login_hint=' + login_hint
    this.setState({login_link: login_url})
  }

  async begin_login() {
    if(this.state.lastpass.type === 3) {
      console.log("company_id=" + this.state.lastpass.CompanyId)
      ipcRenderer.send("company-id", this.state.lastpass.CompanyId);
      ipcRenderer.send("query-oidc", this.state.lastpass.OpenIDConnectAuthority)
      /*await fetch(this.state.lastpass.OpenIDConnectAuthority)
          .then(res => res.json())
          .then(res => this.setState({oidc: res}))
      this.continue_login()*/
    } else {
      alert("Only oauth accounts are supported")
    }
  }

  async check_login(email) {
    const regex = RegExp('.+@.+\\..+');
    // see if the email is a federated login
    if(regex.test(email)) {
      if(this.state.last_checked_email !== email) {
        this.setState({last_checked_email: email})

        ipcRenderer.send("query-email", email);
      }
    }
  }

  get_k2(event){
    if(this.state.company_id && this.state.id_token) {
      console.log('getting k2')
      const url = "https://accounts.lastpass.com/federatedlogin/api/v1/getkey";
      const data = {"company_id": this.state.company_id, "id_token": this.state.id_token}
      fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)})
          .then(res => res.json())
          .then(res => {
            this.setState({k2: res.k2, fragment_id: res.fragment_id});
            ipcRenderer.send("fragment-id", res.fragment_id);
            ipcRenderer.send("k2", res.k2);
            this.setState({stage: 3})
          })
    }
    else {
      console.log('Not ready to get k2')
    }
  }


  handleChange(event) {
    this.setState({email: event.target.value})
    this.check_login(event.target.value)
  }
  handleSubmit(event) {
    this.check_login(this.state.email)
    event.preventDefault();
  }

  render() {
    if(this.state.stage === 0) {
      ipcRenderer.send('get-email');
      ipcRenderer.send('get-stage')

       return (<p>Starting...</p>)
    }
    else if(this.state.stage === 1) {
      if (this.state.email && !this.state.login_link) {
        this.check_login(this.state.email)
      }
      if (this.state.login_link) {
        return (
            <a href={this.state.login_link}>Continue to Okta</a>
        );
      } else {
        return (
            <form onSubmit={this.handleSubmit}>
              <label>
                Email address:
                <input type="text" value={this.state.email} onChange={this.handleChange}/>
              </label>
            </form>
        );
      }
    }
    else if(this.state.stage === 2) {
      if(!this.state.company_id) {
        ipcRenderer.send('get-company-id');
      }
      if(!this.state.id_token) {
        ipcRenderer.send('get-id-token');
      }
      return (<p>Finishing...</p>)
    }
    else if(this.state.stage === 3) {
      return (<p>Done...</p>)
    } else {
      return (<p>Stage {this.state.stage} NYI</p>)
    }
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(e(NameForm), domContainer);

