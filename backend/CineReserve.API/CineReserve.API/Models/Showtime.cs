namespace CineReserve.API.Models
{
    public class Showtime
    {
        public int Id { get; set; }

        public int MovieId { get; set; }

        public DateTime ShowDate { get; set; }

        public TimeSpan ShowTime { get; set; }

        public string HallName { get; set; }

        public Movie Movie { get; set; }
    }
}