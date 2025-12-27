import type { LoginButtonProps } from '../../interfaces/LoginButtonProps';
import GoogleIcon from './google-icon.svg?react';
import './GoogleLoginButton.css';

export const GoogleLoginButton: React.FC<LoginButtonProps> = ({ onClick, loading, disabled }: LoginButtonProps) => {
    return <button className="gsi-material-button" onClick={onClick} disabled={disabled || loading}>
        <div className="gsi-material-button-state"></div>
        <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
                <GoogleIcon className="block" />
            </div>
            {!loading && <span className="gsi-material-button-contents">Sign in with Google</span>}
            {loading && <span className="gsi-loader"></span>}
            <span style={{ display: "none" }}>Sign in with Google</span>
        </div>
    </button>
}