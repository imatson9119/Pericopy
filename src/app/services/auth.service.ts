import { inject, Injectable, signal } from '@angular/core';
import { Auth, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, User } from '@angular/fire/auth';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private auth = inject(Auth);
  private _snackbarService = inject(SnackbarService);

  user = signal<User | null>(this.auth.currentUser);

  constructor() { 
    this.auth.setPersistence(browserLocalPersistence);
    this.auth.onAuthStateChanged((user) => {
      this.user.set(user);
    });
  }

  isLoggedIn() {
    return this.auth.currentUser !== null;
  }

  signInWithGoogle(): Promise<User | null> {
    return signInWithPopup(this.auth, new GoogleAuthProvider())
      .then((result) => {
        return result.user;
      }).catch((error) => {
        const errorMessage = error.message;
        this._snackbarService.showError(errorMessage);
        return null;
      });
  }
}
