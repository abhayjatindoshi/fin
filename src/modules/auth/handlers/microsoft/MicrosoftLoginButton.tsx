import type { LoginButtonProps } from '../../interfaces/LoginButtonProps';
import './MicrosoftLoginButton.css';
import MicrosoftIcon from './microsoft-icon.svg?react';

export const MicrosoftLoginButton: React.FC<LoginButtonProps> = ({ onClick, loading, disabled }: LoginButtonProps) => {
    return <button className="ms-material-button" onClick={onClick} disabled={disabled || loading}>
        <div className="ms-material-button-state"></div>
        <div className="ms-material-button-content-wrapper">
            <div className="ms-material-button-icon">
                <MicrosoftIcon className="block" />
            </div>
            {!loading && <span className="ms-material-button-contents">Sign in with Microsoft</span>}
            {loading && <span className="ms-loader"></span>}
            <span style={{ display: "none" }}>Sign in with Microsoft</span>
        </div>
    </button>
}