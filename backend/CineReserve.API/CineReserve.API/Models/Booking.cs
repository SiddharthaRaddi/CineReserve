namespace CineReserve.API.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string BookingReference { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime BookingTime { get; set; }
    }
}