// Quote Service for Random Quote Display
class QuotesService {
  constructor() {
    this.quotes = [
      {
        "quote": "Experiments are the only means of knowledge at our disposal. The rest is poetry, imagination.",
        "author": "Max Planck"
      },
      {
        "quote": "As far as the laws of mathematics refer to reality, they are not certain; and as far as they are certain, they do not refer to reality.",
        "author": "Albert Einstein"
      },
      {
        "quote": "What we observe is not nature itself but nature exposed to our method of questioning.",
        "author": "Werner Heisenberg"
      },
      {
        "quote": "Do you really believe the moon is only there when you look at it?",
        "author": "Albert Einstein to Abraham Pais"
      },
      {
        "quote": "God tirelessly plays dice under laws which he has himself prescribed.",
        "author": "Albert Einstein"
      },
      {
        "quote": "Quantum physics tells us that no matter how thorough our observation of the present, the (unobserved) past, like the future, is indefinite and exists only as a spectrum of possibilities.",
        "author": "Stephen Hawking"
      },
      {
        "quote": "The more accurate the calculations became, the more the concepts tended to vanish into thin air.",
        "author": "R. S. Mulliken"
      }
    ];
    
    this.currentQuoteIndex = null;
    this.usedQuotes = new Set();
  }

  /**
   * Get a random quote that hasn't been used in this session
   * @returns {Object} Quote object with quote and author
   */
  getRandomQuote() {
    // If all quotes have been used, reset the used quotes
    if (this.usedQuotes.size >= this.quotes.length) {
      this.usedQuotes.clear();
    }

    // Get available quotes (not yet used)
    const availableIndexes = this.quotes
      .map((_, index) => index)
      .filter(index => !this.usedQuotes.has(index));

    // Select random index from available quotes
    const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    
    // Mark this quote as used
    this.usedQuotes.add(randomIndex);
    this.currentQuoteIndex = randomIndex;

    return this.quotes[randomIndex];
  }

  /**
   * Get the current quote for the session
   * @returns {Object} Current quote object - generates one if none exists
   */
  getCurrentQuote() {
    if (this.currentQuoteIndex !== null) {
      return this.quotes[this.currentQuoteIndex];
    }
    // If no current quote exists, generate one
    return this.getRandomQuote();
  }

  /**
   * Get a new quote (different from current)
   * @returns {Object} New quote object
   */
  getNewQuote() {
    return this.getRandomQuote();
  }

  /**
   * Reset the quote service (for new login sessions)
   */
  reset() {
    this.currentQuoteIndex = null;
    this.usedQuotes.clear();
  }

  /**
   * Get a quote for login (first quote of the session)
   * @returns {Object} Quote object for login
   */
  getLoginQuote() {
    this.reset(); // Reset for new session
    return this.getRandomQuote();
  }
}

// Create singleton instance
const quotesService = new QuotesService();

export default quotesService;