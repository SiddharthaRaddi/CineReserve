namespace CineReserve.API.Models
{
    public class TicketDetail
    {
        public int Id { get; set; }

        public int BookingId { get; set; }

        public int ShowtimeId { get; set; }

        public string RowNumber { get; set; }

        public int SeatNumber { get; set; }

        public decimal Price { get; set; }
    }
}