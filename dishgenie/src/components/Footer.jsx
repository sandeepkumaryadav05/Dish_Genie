import "../App.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="signature">
            Dish<span>Genie</span>
          </span>
        </div>
        <div className="footer-center">
          Made with ❤ by foodies, for foodies
        </div>
        <div className="footer-right">
          © {currentYear} DishGenie. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
