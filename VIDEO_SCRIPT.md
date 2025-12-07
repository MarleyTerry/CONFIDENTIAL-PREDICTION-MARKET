# Confidential Prediction Market - Video Demonstration Script

## 1-Minute Demo Video for Zama FHEVM Bounty December 2025

**Total Duration**: 60 seconds
**Target Audience**: Blockchain developers, FHEVM learners, competition judges
**Goal**: Demonstrate FHEVM concepts through practical prediction market implementation

---

## Scene Breakdown

### Scene 1: Introduction (0:00 - 0:10)
**Duration**: 10 seconds
**Visual**:
- Show project title card: "Confidential Prediction Market - FHEVM Example"
- Display tagline: "Privacy-Preserving Betting with Fully Homomorphic Encryption"
- Quick fade to live application homepage

**Dialogue**: *(See DIALOGUE)*

**On-Screen Text**:
- "Built with FHEVM"
- "Zama Bounty December 2025"

---

### Scene 2: Problem Statement (0:10 - 0:18)
**Duration**: 8 seconds
**Visual**:
- Split screen showing traditional vs. encrypted prediction markets
- Left side: Red X marks showing exposed data (bet amounts, predictions)
- Right side: Green checkmarks showing encrypted protection

**Dialogue**: *(See DIALOGUE)*

**On-Screen Text**:
- "Traditional Markets: Exposed Data ❌"
- "FHE Markets: Private Data ✅"

---

### Scene 3: Code Demonstration - Encrypted Types (0:18 - 0:28)
**Duration**: 10 seconds
**Visual**:
- Code editor showing PredictionMarket.sol
- Highlight lines with `euint32` and `ebool` types
- Zoom into the Bet struct definition

**Code Shown**:
```solidity
struct Bet {
    euint32 encryptedAmount;      // Encrypted bet amount
    ebool encryptedPrediction;     // Encrypted YES/NO prediction
    bool claimed;
    address bettor;
}
```

**Dialogue**: *(See DIALOGUE)*

**On-Screen Annotations**:
- Arrow pointing to `euint32`: "32-bit encrypted integer"
- Arrow pointing to `ebool`: "Encrypted boolean"

---

### Scene 4: Access Control Pattern (0:28 - 0:36)
**Duration**: 8 seconds
**Visual**:
- Show code snippet of `placeBet()` function
- Highlight `FHE.allowThis()` and `FHE.allow()` calls
- Animated diagram showing permission flow

**Code Shown**:
```solidity
// Allow contract to access encrypted values
FHE.allowThis(encryptedAmount);
FHE.allowThis(encryptedPrediction);

// Allow bettor to retrieve their encrypted data
FHE.allow(encryptedAmount, msg.sender);
FHE.allow(encryptedPrediction, msg.sender);
```

**Dialogue**: *(See DIALOGUE)*

**On-Screen Annotations**:
- "Contract Access" with green checkmark
- "User Access" with green checkmark

---

### Scene 5: Live Demo - User Interaction (0:36 - 0:50)
**Duration**: 14 seconds
**Visual**:
- Screen recording of live application at https://prediction-market-sepia.vercel.app/
- Show sequence:
  1. Wallet connection (MetaMask popup)
  2. Browse available markets
  3. Select market: "Will Bitcoin reach $100k in 2025?"
  4. Place encrypted bet (show bet form with amount and YES/NO selection)
  5. MetaMask transaction confirmation
  6. Success notification

**Dialogue**: *(See DIALOGUE)*

**On-Screen Highlights**:
- Circle the encrypted bet amount field
- Highlight "Privacy Protected" badge
- Show transaction hash appearing

---

### Scene 6: On-Chain Verification (0:50 - 0:56)
**Duration**: 6 seconds
**Visual**:
- Etherscan page showing deployed contract
- Highlight contract address: `0xdd3e74ad708CF61B14c83cF1826b5e3816e0de69`
- Show recent transactions list
- Quick scroll through verified contract code

**Dialogue**: *(See DIALOGUE)*

**On-Screen Text**:
- "Deployed on Sepolia"
- "Contract: 0xdd3e...de69"
- "Verified on Etherscan ✓"

---

### Scene 7: Closing & Call to Action (0:56 - 1:00)
**Duration**: 4 seconds
**Visual**:
- Return to application homepage
- Fade to end card with project information

**Dialogue**: *(See DIALOGUE)*

**End Card Display**:
- **GitHub**: github.com/MarleyTerry/PredictionMarket
- **Live Demo**: prediction-market-sepia.vercel.app
- **Built for Zama FHEVM Bounty December 2025**
- Logo: Zama logo + project icon

---

## Technical Requirements

### Video Specifications
- **Resolution**: 1920x1080 (1080p Full HD)
- **Frame Rate**: 30fps
- **Format**: MP4 (H.264 codec)
- **Audio**: Clear voice-over with background music (subtle, non-distracting)
- **Bitrate**: 8-10 Mbps for high quality

### Screen Recording Settings
- **Tool**: OBS Studio or similar professional screen recorder
- **Browser**: Chrome/Brave with MetaMask extension
- **Font Size**: Increased for readability (16pt minimum in code editor)
- **Cursor**: Highlighted/enlarged for visibility

### Code Display Settings
- **Theme**: Dark theme with high contrast
- **Font**: Fira Code or JetBrains Mono (monospace)
- **Size**: 18-20pt for code snippets
- **Highlighting**: Syntax highlighting enabled
- **Line Numbers**: Visible on left margin

---

## Production Notes

### Pre-Production Checklist
- [ ] Test application on Sepolia testnet
- [ ] Ensure sufficient test ETH in demo wallet
- [ ] Pre-create markets with interesting questions
- [ ] Prepare code snippets in VS Code with proper formatting
- [ ] Test screen recording with clear visibility
- [ ] Write and rehearse voice-over script

### Recording Tips
1. **Multiple Takes**: Record each scene 2-3 times, use best take
2. **Smooth Transitions**: Use fade/dissolve between scenes (0.5s duration)
3. **Pacing**: Speak clearly and not too fast (maintain 60-second total)
4. **Visual Consistency**: Use consistent color scheme across all screens
5. **Error Handling**: Have fallback footage if live demo fails

### Post-Production
- Add subtle background music (royalty-free)
- Include on-screen text annotations for emphasis
- Apply color grading for professional appearance
- Add zoom effects on important code sections
- Include subtle animations for transitions
- Export with high-quality settings

---

## B-Roll Footage Ideas

### Additional Visuals (if time permits)
- Animation showing FHE encryption process
- Diagram of blockchain transaction flow
- Comparison chart: traditional vs. encrypted markets
- Code repository file structure overview
- Terminal showing contract deployment output

---

## Accessibility Considerations

### Subtitles/Captions
- Include full captions for all spoken dialogue
- Use large, readable font (Arial or similar sans-serif)
- High contrast (white text on dark background)
- Position at bottom center of frame

### Visual Clarity
- Ensure all text is readable at 720p resolution
- Use color-blind friendly palette
- Maintain 4:1 contrast ratio minimum
- Avoid rapid flashing or strobing effects

---

## Assets Required

### Graphics
- Project logo/icon
- Zama logo (official branding)
- "FHEVM" badge graphic
- Ethereum logo
- MetaMask logo

### Audio
- Professional voice-over recording
- Background music track (royalty-free)
- UI click/success sound effects (optional, subtle)

### Footage
- Screen recordings of application
- Code editor footage
- Blockchain explorer screenshots
- Wallet interaction recordings

---

## Distribution Format

### Primary Video
- **Filename**: `Video_Demonstration.mp4`
- **Location**: Project root directory
- **Max File Size**: 100MB (for GitHub compatibility)
- **Backup**: High-quality version on Google Drive/YouTube

### Supporting Files
- `VIDEO_SCRIPT.md` - This document
- `DIALOGUE` - Voice-over transcript only
- `Transaction Screenshots.png` - On-chain verification
- Thumbnail image for video preview (1280x720)

---

## Quality Assurance Checklist

Before finalizing video:
- [ ] Total duration is 55-60 seconds
- [ ] All dialogue is clearly audible
- [ ] Code is readable and properly formatted
- [ ] No typos in on-screen text
- [ ] Smooth transitions between scenes
- [ ] Application demo works without errors
- [ ] Etherscan link is correct and accessible
- [ ] End card displays all contact information
- [ ] File size is reasonable (<100MB)
- [ ] Video plays correctly on multiple platforms

---

## Version Control

- **Script Version**: 1.0
- **Last Updated**: 2025-12-07
- **Author**: Claude Code for Zama FHEVM Bounty
- **Review Status**: Ready for production

---

**Note**: This script is optimized for a 60-second demonstration video showcasing FHEVM concepts through the Confidential Prediction Market application. All timings are approximate and may be adjusted during production to ensure smooth pacing and clarity.
