import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Showtime {
  id: number;
  time: string;
}

interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: string;
  rating: string;
  poster: string;
  showtimes: Showtime[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  selectedSeats: string[] = [];
  bookedSeats: string[] = [];
  totalAmount = 0;
  currentShowtimeId = 1;
  selectedMovieTitle = '';
  selectedShowtimeLabel = '';

  rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  seats = [1, 2, 3, 4, 5, 6, 7, 8];

  backendUrl = 'https://localhost:7161';

  movies: Movie[] = [];
  moviesLoading = true;

  // Fallback hardcoded movies (shown if backend is unreachable)
  private fallbackMovies: Movie[] = [
    {
      id: 1,
      title: 'Avengers: Endgame',
      genre: 'Action / Sci-Fi',
      duration: '180 min',
      rating: '8.4',
      poster: 'https://m.media-amazon.com/images/I/81ExhpBEbHL.jpg',
      showtimes: [{ id: 1, time: '6:00 PM' }, { id: 2, time: '9:00 PM' }],
    },
    {
      id: 2,
      title: 'Interstellar',
      genre: 'Sci-Fi / Drama',
      duration: '170 min',
      rating: '8.7',
      poster: 'https://m.media-amazon.com/images/I/91kFYg4fX3L.jpg',
      showtimes: [{ id: 3, time: '7:00 PM' }],
    },
    {
      id: 3,
      title: 'The Dark Knight',
      genre: 'Action / Crime',
      duration: '152 min',
      rating: '9.0',
      poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      showtimes: [{ id: 4, time: '3:00 PM' }, { id: 5, time: '8:30 PM' }],
    },
    {
      id: 4,
      title: 'Inception',
      genre: 'Sci-Fi / Thriller',
      duration: '148 min',
      rating: '8.8',
      poster: 'https://m.media-amazon.com/images/I/91Rc8cAmnAL.jpg',
      showtimes: [{ id: 6, time: '5:00 PM' }],
    },
  ];

  // Toast state
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  bookingRef = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies() {
    this.moviesLoading = true;

    // Step 1: fetch movies from backend
    this.http.get<any[]>(`${this.backendUrl}/api/movies`).subscribe({
      next: (backendMovies) => {
        // Filter out empty ghost movies that might be in the database
        const validMovies = backendMovies.filter(m => m.title && m.title.trim() !== '');

        // Working Wikipedia fallback posters for the movies with broken URLs in the DB
        const tmdbPosters: Record<string, string> = {
          'Avengers Endgame': 'https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg',
          'Interstellar': 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
          'Spider-Man: No Way Home': 'https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg',
          'Spider-Man': 'https://upload.wikimedia.org/wikipedia/en/f/f3/Spider-Man2002Poster.jpg',
          'Oppenheimer': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29_poster.jpg'
        };

        // Step 2: fetch all showtimes from backend and match them
        this.http.get<any[]>(`${this.backendUrl}/api/showtimes`).subscribe({
          next: (showtimes) => {
            this.movies = validMovies.map((m) => {
              // Deduplicate showtimes by time string (removes overlapping slots)
              const seenTime = new Set<string>();
              const movieShowtimes = showtimes
                .filter((s: any) => s.movieId === m.id)
                .map((s: any) => ({
                  id: s.id,
                  time: this.formatTime(s.showTime),
                }))
                .filter((s: any) => {
                  if (seenTime.has(s.time)) return false;
                  seenTime.add(s.time);
                  return true;
                });

              return {
                id: m.id,
                title: m.title,
                genre: m.genre || 'Drama',
                duration: m.durationInMinutes ? `${m.durationInMinutes} min` : 'N/A',
                rating: '8.5',
                poster: tmdbPosters[m.title] || m.posterUrl || '',
                showtimes: movieShowtimes,
              };
            });

            this.moviesLoading = false;
            this.cdr.detectChanges();

            // Auto-select the first available showtime
            const firstMovieWithShowtime = this.movies.find(
              (m) => m.showtimes.length > 0,
            );
            if (firstMovieWithShowtime && firstMovieWithShowtime.showtimes.length > 0) {
              const st = firstMovieWithShowtime.showtimes[0];
              this.selectShowtime(st.id, firstMovieWithShowtime.title, st.time);
            }
          },
          error: () => {
            // Showtimes fetch failed — show movies without showtimes
            this.movies = validMovies.map((m) => ({
              id: m.id,
              title: m.title,
              genre: m.genre || 'Drama',
              duration: m.durationInMinutes ? `${m.durationInMinutes} min` : '',
              rating: '8.5',
              poster: m.posterUrl || '',
              showtimes: [],
            }));
            this.moviesLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        // Backend unreachable — use fallback hardcoded movies
        this.movies = this.fallbackMovies;
        this.moviesLoading = false;
        this.selectedMovieTitle = this.fallbackMovies[0].title;
        this.selectedShowtimeLabel = this.fallbackMovies[0].showtimes[0].time;
        this.loadBookedSeats();
        this.cdr.detectChanges();
      },
    });
  }

  /** Converts "18:00:00" → "6:00 PM" */
  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  selectShowtime(id: number, movieTitle: string, timeLabel: string) {
    this.currentShowtimeId = id;
    this.selectedMovieTitle = movieTitle;
    this.selectedShowtimeLabel = timeLabel;
    this.selectedSeats = [];
    this.bookedSeats = [];
    this.totalAmount = 0;
    this.bookingRef = '';
    this.loadBookedSeats();
  }

  loadBookedSeats() {
    this.http
      .get<any[]>(`${this.backendUrl}/api/showtimes/${this.currentShowtimeId}/seats`)
      .subscribe({
        next: (response) => {
          this.bookedSeats = response.map((seat) => `${seat.rowNumber}${seat.seatNumber}`);
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  toggleSeat(seat: string) {
    if (this.isBooked(seat)) return;
    if (this.selectedSeats.includes(seat)) {
      this.selectedSeats = this.selectedSeats.filter((x) => x !== seat);
    } else {
      this.selectedSeats.push(seat);
    }
    this.calculateTotal();
  }

  removeSeat(seat: string) {
    this.selectedSeats = this.selectedSeats.filter((x) => x !== seat);
    this.calculateTotal();
  }

  calculateTotal() {
    let total = 0;
    this.selectedSeats.forEach((seat) => {
      const row = seat.charAt(0);
      total += row === 'G' || row === 'H' ? 400 : 250;
    });
    this.totalAmount = total;
  }

  isSelected(seat: string) { return this.selectedSeats.includes(seat); }
  isBooked(seat: string)   { return this.bookedSeats.includes(seat); }
  isVip(row: string)       { return row === 'G' || row === 'H'; }
  getSeatPrice(seat: string): number {
    return seat.charAt(0) === 'G' || seat.charAt(0) === 'H' ? 400 : 250;
  }

  confirmBooking() {
    if (this.selectedSeats.length === 0) return;

    const seats = this.selectedSeats.map((seat) => ({
      rowNumber: seat.charAt(0),
      seatNumber: Number(seat.substring(1)),
    }));

    const payload = { showtimeId: this.currentShowtimeId, seats };

    this.http.post(`${this.backendUrl}/api/bookings`, payload).subscribe({
      next: () => {
        this.bookingRef = 'CR' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const seatList = this.selectedSeats.join(', ');
        this.showToast(`Booking confirmed! Seats: ${seatList} | Ref: ${this.bookingRef}`, 'success');
        this.selectedSeats = [];
        this.totalAmount = 0;
        this.loadBookedSeats();
      },
      error: () => {
        this.showToast('Booking failed. Please try again.', 'error');
      },
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 4500);
  }
}
