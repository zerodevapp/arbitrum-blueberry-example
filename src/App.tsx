import { usePrivy } from '@privy-io/react-auth';
import Home from './pages/Home';


function Login() {
  const { ready, authenticated, login, logout } = usePrivy();

  return (
    <div className="App">
      <div>
        Authenticated: {authenticated.toString()}
        <br />
        {authenticated && <button onClick={() => logout()}>logout</button>}
        {!authenticated && <button onClick={() => login()}>login</button>}
      </div>
      {ready && authenticated && (
        <Home />
      )}
    </div>
  );
}

export default Login;
