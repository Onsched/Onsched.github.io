import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Swagger from 'swagger-client';
import Oidc from 'oidc-client';
import * as qs from 'query-string';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      tokenData: [],
      apiUrl: 'https://sandbox-api.onsched.com/swagger/v1/swagger.json',
      signinResponse: '',
      accessToken: qs.parse(window.location.hash).access_token
    };

  }

  componentWillMount() {
    Swagger(this.state.apiUrl).then((client) => {
      client.apis.Customers.ConsumerV1CustomersGet().then(res => {
        this.setState({data: res.obj.data});
      });
    })
    .catch((err) => {
      console.log(err);
    });

    var settings = {
      authority: 'https://stage-identity.onsched.com',
      client_id: 'Company.20.js',
      redirect_uri: window.location.origin,
      post_logout_redirect_uri: window.location.origin,
      response_type: 'id_token token',
      scope: 'openid OnSchedApi cid.20',

      filterProtocolClaims: true,
      loadUserInfo: true
    };
    this.setState({client: new Oidc.OidcClient(settings)});
    console.log(this.state);
  }

  render() {
    const {data, tokenData} = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Names from /consumer/v1/customers</h1>
        </header>
        <button onClick={_ => this.signin()}>Login</button>
        <button onClick={_ => this.haveToken()}>Use Token</button>
        <div className="App-intro">
          Without Token
          <ul>{data.map((item, index) => <li key={index}>{item.name}</li>)}</ul>
        </div>
        <div className="App-intro">
          With Token
          <ul>{tokenData.map((item, index) => <li key={index}>{item.type}: {item.value}</li>)}</ul>
        </div>
      </div>
    );
  }

  signin() {
    this.state.client.createSigninRequest({ state: { bar: 15 } }).then((req) => {
        console.log("signin request", req, "<a href='" + req.url + "'>go signin</a>");
        window.location = req.url;
    }).catch((err) => {
        console.log(err);
    });
  }

  haveToken() {
    if(this.state.accessToken) {
      Swagger(this.state.apiUrl).then((client) => {
        client.apis.HelloApi.HandshakeClaimsGet({}, {
          // Trick to add the header
          requestInterceptor: (req) => {
            req.headers.Authorization = 'Bearer ' + this.state.accessToken;
            return req;
          }
        }).then(res => {
          // This is what the call returns
          this.setState({tokenData: res.obj});
        });
      })
      .catch((err) => {
        console.log(err);
      });
    }
  }
}

export default App;
