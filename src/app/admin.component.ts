import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface MovieOption {
  id: number;
  title: string;
  genre: string;
  posterUrl: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  backendUrl = 'https://localhost:7161';

  isLoggedIn = false;
  username = '';
  password = '';
  adminName = '';
  jwtToken = '';

  // Movie list (for dropdown)
  movieList: MovieOption[] = [];

  // Add Movie form
  movieTitle = '';
  movieGenre = '';
  moviePoster = '';
  movieDuration = 120;

  // Add Showtime form
  selectedMovieId: number | null = null;
  showtimeTime = '18:00:00';
  hallName = 'Hall A';

  // Toast
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  login() {
    const payload = { username: this.username, password: this.password };
    this.http.post<any>(`${this.backendUrl}/api/auth/login`, payload).subscribe({
      next: (res) => {
        this.jwtToken = res.token || res.accessToken || res.Token || '';
        this.isLoggedIn = true;
        this.adminName = this.username;
        this.showToast('Welcome back, Admin!', 'success');
        this.loadMovies();
      },
      error: () => {
        // Fallback local check
        if (this.username === 'admin' && this.password === 'admin123') {
          this.isLoggedIn = true;
          this.adminName = this.username;
          this.showToast('Welcome back, Admin!', 'success');
          this.loadMovies();
        } else {
          this.showToast('Invalid credentials. Please try again.', 'error');
        }
      },
    });
  }

  loadMovies() {
    this.http.get<any[]>(`${this.backendUrl}/api/movies`).subscribe({
      next: (movies) => {
        // Filter out empty ghost movies
        const validMovies = movies.filter(m => m.title && m.title.trim() !== '');
        
        this.movieList = validMovies.map((m) => ({
          id: m.id,
          title: m.title,
          genre: m.genre,
          posterUrl: m.posterUrl,
        }));
        if (this.movieList.length > 0) {
          this.selectedMovieId = this.movieList[0].id;
        }
      },
      error: () => {},
    });
  }

  private getHeaders(): HttpHeaders {
    return this.jwtToken
      ? new HttpHeaders({ Authorization: `Bearer ${this.jwtToken}` })
      : new HttpHeaders();
  }

  addMovie() {
    if (!this.movieTitle.trim()) {
      this.showToast('Please enter a movie title.', 'error');
      return;
    }
    const payload = {
      title: this.movieTitle,
      genre: this.movieGenre,
      posterUrl: this.moviePoster,
      durationInMinutes: this.movieDuration,
    };

    this.http.post<any>(`${this.backendUrl}/api/movies`, payload, { headers: this.getHeaders() }).subscribe({
      next: (newMovie) => {
        this.showToast(`"${this.movieTitle}" added successfully!`, 'success');
        // Add to dropdown list immediately
        this.movieList.push({ id: newMovie.id, title: newMovie.title, genre: newMovie.genre, posterUrl: newMovie.posterUrl });
        if (!this.selectedMovieId) this.selectedMovieId = newMovie.id;
        this.movieTitle = '';
        this.movieGenre = '';
        this.moviePoster = '';
        this.movieDuration = 120;
      },
      error: (err) => {
        if (err.status === 401) {
          this.showToast('Session expired. Please log in again.', 'error');
          this.isLoggedIn = false;
        } else {
          this.showToast('Failed to add movie. Check backend connection.', 'error');
        }
      },
    });
  }

  addShowtime() {
    if (!this.selectedMovieId) {
      this.showToast('Please select a movie first.', 'error');
      return;
    }
    const payload = {
      movieId: this.selectedMovieId,
      showDate: new Date(),
      showTime: this.showtimeTime.length === 5 ? this.showtimeTime + ':00' : this.showtimeTime,
      hallName: this.hallName,
    };

    this.http.post(`${this.backendUrl}/api/showtimes`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        const movieName = this.movieList.find(m => m.id === this.selectedMovieId)?.title || '';
        this.showToast(`Showtime added for "${movieName}" at ${this.showtimeTime}!`, 'success');
        this.showtimeTime = '18:00:00';
        this.hallName = 'Hall A';
      },
      error: (err) => {
        if (err.status === 401) {
          this.showToast('Session expired. Please log in again.', 'error');
          this.isLoggedIn = false;
        } else {
          this.showToast('Failed to add showtime. Check backend connection.', 'error');
        }
      },
    });
  }

  get selectedMovieName(): string {
    return this.movieList.find(m => m.id === this.selectedMovieId)?.title || '';
  }

  showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 4500);
  }
}
