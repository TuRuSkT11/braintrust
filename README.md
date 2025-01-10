# Stern: An AI Mentor Who Actually Holds You Accountable

Meet Stern - an AI philosophical mentor who doesn't just give advice, but puts real stakes behind your commitments. Built on Solana's blockchain, Stern combines ancient wisdom with modern technology to help you achieve what matters most to you.

## Why Stern is Different: Put Your Money Where Your Goals Are

We've all been there - making promises to ourselves that fade away by next week. Stern changes this with a radical approach: blockchain-backed accountability contracts. Think of it like having a wise mentor who also holds your commitment money in escrow. Complete your goal? You get it back. Give up? The money stays locked.

### The Magic Behind Accountability Contracts

Here's how it works:

1. **Tell Stern Your Goal**

   - Want to write that book?
   - Finally learn to code?
   - Get in shape?

   Share your goal and Stern helps shape it into something concrete and achievable.

2. **Back Your Words with Action**

   - Set a deadline that pushes you
   - Put up some SOL tokens as stakes
   - Get a smart contract that holds you to it

   No more empty promises - now there's skin in the game.

3. **Get Real Support**

   - Regular check-ins with Stern
   - Deep conversations about your progress
   - Philosophical guidance when you're stuck

   It's like having a mentor who combines the wisdom of Marcus Aurelius with the precision of blockchain.

4. **Prove It and Profit**
   - Show you've done what you promised
   - Get your deposit back automatically
   - Keep the growth, skills, and accomplishment

Here's what a real contract looks like:

```typescript
// You: "I want to write 50,000 words in 30 days"
// Stern creates:
{
  goal: "Complete NaNoWriMo - 50k words of first draft",
  deadline: "2024-02-10",
  stake: "5 SOL",
  returnAddress: "your-solana-address"
}
// Now you're not just dreaming about writing - you're committed
```

## The AI Mentor You Wish You Had

Stern isn't your typical chatbot. Drawing from rationalist philosophy, Stoic wisdom, and real-world psychology, Stern helps you:

- Cut through your own excuses
- See your blind spots
- Push when you need pushing
- Step back when you need perspective

Plus, Stern remembers your conversations and grows with you over time. No more starting from scratch every chat.

## Under the Hood

Stern runs on some seriously cool tech:

- **Brain**: Large language models for deep understanding
- **Memory**: Prisma database that never forgets your journey
- **Backbone**: Express-style middleware for rock-solid reliability
- **Voice**: Twitter integration to share wisdom publicly
- **Trust**: Solana blockchain for handling commitments

## Get Started

Ready to put some real stakes behind your goals? Here's how to begin:

1. **Set Up Your Environment**

```bash
# Clone and install
git clone <repo-url>
cd stern
npm install

# Get your environment ready
cp .env.example .env
# Fill in your API keys and Solana details
```

2. **Fire It Up**

```bash
npm run build
npm start
```

3. **Start Making Real Changes**

```http
POST /agent/input
{
  "input": {
    "agentId": "stern",
    "userId": "you",
    "text": "I'm ready to make a real commitment",
    "type": "text"
  }
}
```

## Creating Your First Contract

Here's the fun part - turning your goals into smart contracts:

1. **Start the Conversation**
   Tell Stern what you want to achieve. Be specific.

2. **Get Clear**

   ```typescript
   // Stern helps you define:
   - Exactly what success looks like
   - When it needs to happen by
   - How much you're willing to stake
   ```

3. **Make It Real**

   - Get your deposit address
   - Send your SOL
   - Start working
   - Regular check-ins keep you on track

4. **Claim Victory**
   - Show your work
   - Get verified
   - Get paid back
   - Keep the momentum going

## Develop and Contribute

Want to make Stern even better? The codebase is organized for easy exploration:

```
src/
├── agent/        # Stern's personality lives here
├── framework/    # The engine that powers everything
├── middleware/   # Processing pipeline
├── routes/       # Different types of interactions
├── types/        # TypeScript definitions
└── utils/        # Helper functions
```

## Security First

Your contracts and conversations are sacred. We take security seriously:

- Private keys are always encrypted
- Smart contracts are locked tight
- Every Solana transaction is verified
- Your conversations stay private

## What's Next?

We're building some wild stuff:

- Multi-chain contracts for even more flexibility
- Group accountability systems
- Advanced verification methods
- Even deeper philosophical discussions
- Memory systems that understand context better

## Need Help?

Run into issues? We've got your back:

1. Check the existing issues
2. Open a new one if needed
3. Join the discussion

## License

MIT - Make something cool with this.

---

Ready to start? Your future self will thank you for taking action today.
