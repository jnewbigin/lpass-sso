
const e = React.createElement;

const API = "https://lastpass.com/lmiapi/login/type?username=" 

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {email: '', lastpass: {}, oidc: {}, login_link: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    window.ipcRenderer.on("state", (data) => {
      console.log(`Received ${data} from main process`);
    });
    window.ipcRenderer.on("get-email", (event, data) => {
      console.log(`Received ${data} from main process`);
      if(data) {
        this.setState({"email": data})
      }
    });
    window.ipcRenderer.send('get-email');

  }

  create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
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
    if(this.state.lastpass.type == 3) {
      console.log("company_id=" + this.state.lastpass.CompanyId)
      window.ipcRenderer.send("company-id", this.state.lastpass.CompanyId);
      let oidc = await fetch(this.state.lastpass.OpenIDConnectAuthority)
          .then(res => res.json())
          .then(res => this.setState({oidc: res}))
      this.continue_login()
    } else {
      alert("Only oauth accounts are supported")
    }
  }

  async check_login(email) {
    // see if the email is a federated login
    if(email) {
      const url = "https://lastpass.com/lmiapi/login/type?username=" + email;
      await fetch(url, {mode:'no-cors'})
          .then(res => res.json())
          .then(res => { this.setState({lastpass: res}) })
      if(this.state.lastpass.type > 0) {
          this.begin_login()
        }
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
    if(this.state.email && !this.state.login_link) {
      this.check_login(this.state.email)
    }
    if(this.state.login_link) {
      return (
        <a href={this.state.login_link}>Continue to Okta</a>
      );
    } else {
      return (
        <form onSubmit={this.handleSubmit}>
          <label>
            Email address:
            <input type="text" value={this.state.email} onChange={this.handleChange} /></label>
        </form>
      );
    }
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(e(NameForm), domContainer);

