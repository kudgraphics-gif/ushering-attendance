import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { analyticsAPI, eventsAPI, attendanceAPI } from '../services/api';
import type { Event, UserDto } from '../types';
import toast from 'react-hot-toast';
import { MapPin, Calendar, CheckCircle2, User, Info, Crown, AlertTriangle, ArrowRight, Music, DollarSign, BookOpen, Clock, Trophy, Play, RotateCcw, HelpCircle, X, Check } from 'lucide-react';
import { getNearestVenue } from '../utils/geoCheck';
import { SuggestionBox } from '../components/ui/SuggestionBox';
import { LocationWarningModal } from '../components/ui/LocationWarningModal';
import { DeviceIdWarningModal } from '../components/ui/DeviceIdWarningModal';
import {
    getDeviceId,
    recordDeviceCheckIn,
    hasDeviceCheckedInToday,
    recordDeviceCheckOut,
    hasDeviceCheckedOutToday
} from '../utils/deviceId';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

interface AttendanceRecord {
    id: string;
    user_id: string;
    date: string;
    week_day: string;
    time_in: string;
    time_out: string | null;
    marked_by: string | null;
    event_id: string;
    attendance_type: string;
    created_at: string;
    updated_at: string;
}

interface UserAttendance {
    user: UserDto;
    history: AttendanceRecord[];
    summary: {
        total_days: number;
        days_present: number;
        rate: number;
    };
}

const SCRIPTURES = [
    { text: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.", ref: "1 Peter 4:10" },
    { text: "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.", ref: "Mark 10:45" },
    { text: "Serve wholeheartedly, as if you were serving the Lord, not people.", ref: "Ephesians 6:7" },
    { text: "Whoever wants to be a leader among you must be your servant.", ref: "Matthew 20:26" },
    { text: "I was glad when they said unto me, Let us go into the house of the Lord.", ref: "Psalm 122:1" },
    { text: "Commit your work to the Lord, and your plans will be established.", ref: "Proverbs 16:3" },
    { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", ref: "Colossians 3:23" },
    { text: "God is not unjust; he will not forget your work and the love you have shown him as you have helped his people and continue to help them.", ref: "Hebrews 6:10" },
    { text: "For a day in your courts is better than a thousand elsewhere. I would rather be a doorkeeper in the house of my God...", ref: "Psalm 84:10" },
    { text: "Let all things be done decently and in order.", ref: "1 Corinthians 14:40" },
    { text: "Do not neglect to do good and to share what you have, for such sacrifices are pleasing to God.", ref: "Hebrews 13:16" },
    { text: "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord...", ref: "1 Corinthians 15:58" },
    { text: "By love serve one another.", ref: "Galatians 5:13" },
    { text: "Let your light so shine before men, that they may see your good works and glorify your Father in heaven.", ref: "Matthew 5:16" },
    { text: "As for you, brothers, do not grow weary in doing good.", ref: "2 Thessalonians 3:13" },
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "The liberal soul shall be made fat: and he that watereth shall be watered also himself.", ref: "Proverbs 11:25" },
    { text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.", ref: "Galatians 6:9" },
    { text: "Present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship.", ref: "Romans 12:1" },
    { text: "Well done, good and faithful servant. You have been faithful over a little; I will set you over much.", ref: "Matthew 25:21" }
];

interface Question {
    question: string;
    options: string[];
    answer: number;
}

const QUIZ_QUESTIONS: Question[] = [
    {
        question: "When was Koinonia Global (Eternity Network International) founded?",
        options: ["March 11, 2011", "March 11, 2012", "March 15, 2010", "April 1, 2013"],
        answer: 0
    },
    {
        question: "What is the full name of the Head of Department of Koinonia Global Ushering Department?",
        options: ["Pastor Joshua Selman", "Pastor Abiodun Awe", "Pastor Emmanuel Awe", "Pastor Gideon Obafemi"],
        answer: 1
    },
    {
        question: "When was Apostle Joshua Selman born?",
        options: ["June 25, 1980", "June 25, 1982", "May 15, 1978", "July 12, 1981"],
        answer: 0
    },
    {
        question: "Where was Koinonia Global first established?",
        options: ["Abuja, FCT", "Zaria, Kaduna State", "Lagos State", "Jos, Plateau State"],
        answer: 1
    },
    {
        question: "What does the Greek word 'Koinonia' translate to in English?",
        options: ["Fellowship & Communion", "Power & Anointing", "Prayer & Worship", "Sacrifice & Service"],
        answer: 0
    },
    {
        question: "How many core values are officially highlighted in our Koinonia Ushering Department?",
        options: ["5", "6", "7", "8"],
        answer: 2
    },
    {
        question: "Identify the verse: 'I would rather be a doorkeeper in the house of my God than dwell in the tents of the wicked.'",
        options: ["Psalm 122:1", "Psalm 84:10", "Psalm 23:6", "Psalm 27:4"],
        answer: 1
    },
    {
        question: "Which of the following is NOT one of the official roster halls in Koinonia Abuja?",
        options: ["Main Hall", "Hall One", "Sanctuary", "Basement"],
        answer: 2
    },
    {
        question: "What is the motto/badge of the Koinonia Ushering Department?",
        options: ["Usher with a Difference", "Excellence in Service", "Fellowship of the Saints", "Love and Unity"],
        answer: 0
    },
    {
        question: "Which book of the Bible says: 'Serve wholeheartedly, as if you were serving the Lord, not people'?",
        options: ["Colossians 3:23", "Romans 12:1", "Ephesians 6:7", "Hebrews 6:10"],
        answer: 2
    },
    // Selman Quotes
    {
        question: "Complete the quote: 'Who hates you does not matter, who ___ you does.'",
        options: ["fears", "ignores", "likes", "praises"],
        answer: 2
    },
    {
        question: "Complete the quote: 'When God wants to bless you, He sends a ___. When the enemy wants to destroy you, he also sends a ___.'",
        options: ["angel", "prophet", "person", "demon"],
        answer: 2
    },
    {
        question: "Complete the quote: 'Intimacy with God is the source of true spiritual ___.'",
        options: ["wealth", "authority", "wisdom", "influence"],
        answer: 1
    },
    {
        question: "Complete the quote: 'Spiritual power is not cheap; it costs dying to ___.'",
        options: ["sin", "flesh", "self", "world"],
        answer: 2
    },
    {
        question: "Complete the quote: 'Consistency is the key that unlocks the door to ___.'",
        options: ["success", "favor", "mastery", "greatness"],
        answer: 2
    },
    {
        question: "Complete the quote: 'Wisdom is the correct application of ___.'",
        options: ["truth", "understanding", "knowledge", "instruction"],
        answer: 2
    },
    {
        question: "Complete the quote: 'Favor is not just a general grace; it is a specialized reward for ___.'",
        options: ["giving", "alignment", "faith", "patience"],
        answer: 1
    },
    {
        question: "Complete the quote: 'The secret of men is in their stories, and the secret of their stories is in their search for ___.'",
        options: ["wisdom", "God", "success", "power"],
        answer: 1
    },
    {
        question: "Complete the quote: 'It is better to be prepared for an opportunity and not have one, than to have an opportunity and not be ___.'",
        options: ["aligned", "anointed", "prepared", "qualified"],
        answer: 2
    },
    {
        question: "Complete the quote: 'Every transition in life requires a structural adjustment of your ___.'",
        options: ["mindset", "attitude", "finances", "relationships"],
        answer: 0
    },
    {
        question: "Complete the quote: 'God does not call the qualified; He ___ the called.'",
        options: ["announces", "qualifies", "glorifies", "protects"],
        answer: 1
    },
    {
        question: "Complete the quote: 'Your value is not in what you have, but in who you are becoming in ___.'",
        options: ["life", "the ministry", "Christ", "your career"],
        answer: 2
    },
    {
        question: "Complete the quote: 'The pain of discipline is better than the pain of ___.'",
        options: ["failure", "defeat", "regret", "sorrow"],
        answer: 2
    },
    {
        question: "Complete the quote: 'The presence of God is the launchpad for a life of power and ___.'",
        options: ["wealth", "peace", "influence", "success"],
        answer: 2
    },
    // Bible & general knowledge
    {
        question: "Who built the Ark according to God's instructions?",
        options: ["Moses", "Abraham", "Noah", "David"],
        answer: 2
    },
    {
        question: "Who was swallowed by a great fish when running from God?",
        options: ["Jonah", "Job", "Jeremiah", "Jude"],
        answer: 0
    },
    {
        question: "Who was chosen as the first king of Israel?",
        options: ["David", "Saul", "Solomon", "Samuel"],
        answer: 1
    },
    {
        question: "Who defeated the giant Goliath with a sling and a stone?",
        options: ["Samson", "Joshua", "Gideon", "David"],
        answer: 3
    },
    {
        question: "What is the shortest verse in the Bible?",
        options: ["Jesus wept.", "Rejoice evermore.", "Pray without ceasing.", "God is love."],
        answer: 0
    },
    {
        question: "How many books are there in the New Testament?",
        options: ["39", "27", "66", "12"],
        answer: 1
    },
    {
        question: "How many books are there in the Old Testament?",
        options: ["39", "27", "66", "12"],
        answer: 0
    },
    {
        question: "Who led the Israelites out of Egypt?",
        options: ["Joshua", "Joseph", "Moses", "Aaron"],
        answer: 2
    },
    {
        question: "Where was Jesus born?",
        options: ["Nazareth", "Jerusalem", "Bethlehem", "Galilee"],
        answer: 2
    },
    {
        question: "Who betrayed Jesus for 30 pieces of silver?",
        options: ["Peter", "Judas Iscariot", "Thomas", "John"],
        answer: 1
    },
    {
        question: "Who was the oldest man recorded in the Bible?",
        options: ["Enoch", "Adam", "Methuselah", "Noah"],
        answer: 2
    },
    {
        question: "On which mountain did Moses receive the Ten Commandments?",
        options: ["Mount Sinai", "Mount Ararat", "Mount Carmel", "Mount Olives"],
        answer: 0
    },
    {
        question: "How many disciples did Jesus choose?",
        options: ["10", "12", "70", "14"],
        answer: 1
    },
    {
        question: "What was the first plague that God sent upon Egypt?",
        options: ["Frogs", "Locusts", "Water turned into blood", "Darkness"],
        answer: 2
    },
    {
        question: "Who was David's best friend, the son of King Saul?",
        options: ["Abner", "Jonathan", "Absalom", "Solomon"],
        answer: 1
    },
    {
        question: "Who wrote the Book of Revelation?",
        options: ["Paul", "John", "Peter", "Luke"],
        answer: 1
    },
    {
        question: "Who was the wife of Abraham and mother of Isaac?",
        options: ["Sarah", "Rebekah", "Rachel", "Leah"],
        answer: 0
    },
    {
        question: "Who was thrown into the lions' den for praying to God?",
        options: ["Shadrach", "Meshach", "Daniel", "Abednego"],
        answer: 2
    },
    {
        question: "What did God create on the first day?",
        options: ["Sky", "Sun and Moon", "Light", "Plants"],
        answer: 2
    },
    {
        question: "Who was the first woman created by God?",
        options: ["Eve", "Sarah", "Ruth", "Mary"],
        answer: 0
    },
    {
        question: "Who killed his brother Abel?",
        options: ["Seth", "Cain", "Enosh", "Jared"],
        answer: 1
    },
    {
        question: "What is the final book of the Old Testament?",
        options: ["Zechariah", "Malachi", "Haggai", "Micah"],
        answer: 1
    },
    {
        question: "What is the first book of the Bible?",
        options: ["Exodus", "Genesis", "Matthew", "Leviticus"],
        answer: 1
    },
    {
        question: "Who was the wisest king of Israel and built the first Temple?",
        options: ["David", "Saul", "Solomon", "Hezekiah"],
        answer: 2
    },
    {
        question: "Who was the mother of Jesus?",
        options: ["Elizabeth", "Mary", "Martha", "Joanna"],
        answer: 1
    },
    {
        question: "What did John the Baptist eat in the wilderness?",
        options: ["Bread and fish", "Wild herbs", "Locusts and wild honey", "Manna"],
        answer: 2
    },
    {
        question: "Who was raised from the dead by Jesus after being in the tomb for four days?",
        options: ["Jairus' daughter", "Lazarus", "The widow's son", "Tabitha"],
        answer: 1
    },
    {
        question: "Which disciple denied Jesus three times before the rooster crowed?",
        options: ["Judas", "Peter", "John", "Thomas"],
        answer: 1
    },
    {
        question: "What is the first commandment among the Ten Commandments?",
        options: [
            "Honor your father and mother",
            "You shall not steal",
            "You shall have no other gods before me",
            "Remember the Sabbath day"
        ],
        answer: 2
    },
    {
        question: "Who was the first Christian martyr, stoned to death for his faith?",
        options: ["Stephen", "Paul", "James", "Philip"],
        answer: 0
    },
    {
        question: "Which apostle was blinded on the road to Damascus?",
        options: ["Peter", "Barnabas", "Paul", "Silas"],
        answer: 2
    },
    // New 30 Questions pool expansion
    {
        question: "Who was the first high priest of Israel?",
        options: ["Moses", "Aaron", "Eleazar", "Joshua"],
        answer: 1
    },
    {
        question: "How many years did the Israelites wander in the wilderness?",
        options: ["30", "40", "50", "70"],
        answer: 1
    },
    {
        question: "What city's walls collapsed after the Israelites marched around them for seven days?",
        options: ["Jerusalem", "Ai", "Jericho", "Gibeon"],
        answer: 2
    },
    {
        question: "Who was the mother of Samuel the prophet?",
        options: ["Peninnah", "Hannah", "Ruth", "Naomi"],
        answer: 1
    },
    {
        question: "What was the name of the garden where Adam and Eve lived?",
        options: ["Gethsemane", "Eden", "Sinai", "Zion"],
        answer: 1
    },
    {
        question: "Which disciple was a tax collector before following Jesus?",
        options: ["Peter", "Andrew", "Matthew", "Philip"],
        answer: 2
    },
    {
        question: "What did Moses' staff turn into when he threw it on the ground in front of Pharaoh?",
        options: ["A snake", "A branch", "A sword", "Water"],
        answer: 0
    },
    {
        question: "How many plagues did God send upon Egypt?",
        options: ["7", "10", "12", "40"],
        answer: 1
    },
    {
        question: "Who was the twin brother of Jacob?",
        options: ["Joseph", "Benjamin", "Esau", "Reuben"],
        answer: 2
    },
    {
        question: "What was the name of Abraham's son born to Hagar?",
        options: ["Isaac", "Ishmael", "Joseph", "Midian"],
        answer: 1
    },
    {
        question: "Which book of the Bible contains the Sermon on the Mount?",
        options: ["Mark", "Luke", "John", "Matthew"],
        answer: 3
    },
    {
        question: "Who was the father of King David?",
        options: ["Saul", "Jesse", "Solomon", "Samuel"],
        answer: 1
    },
    {
        question: "What is the longest chapter in the Bible?",
        options: ["Psalm 23", "Psalm 119", "Psalm 91", "Isaiah 53"],
        answer: 1
    },
    {
        question: "Who wrote most of the Psalms?",
        options: ["Solomon", "David", "Moses", "Asaph"],
        answer: 1
    },
    {
        question: "Who was the king of Babylon who lost his mind and lived like a beast?",
        options: ["Darius", "Cyrus", "Nebuchadnezzar", "Belshazzar"],
        answer: 2
    },
    {
        question: "What did Jesus use to feed the 5,000?",
        options: ["7 loaves and 3 fish", "5 loaves and 2 fish", "Manna", "Bread and wine"],
        answer: 1
    },
    {
        question: "Where did Jesus perform his first miracle?",
        options: ["Nazareth", "Jerusalem", "Cana of Galilee", "Capernaum"],
        answer: 2
    },
    {
        question: "Who was the wife of Isaac?",
        options: ["Sarah", "Rebekah", "Rachel", "Leah"],
        answer: 1
    },
    {
        question: "Which book comes directly after Deuteronomy in the Old Testament?",
        options: ["Judges", "Joshua", "Ruth", "Samuel"],
        answer: 1
    },
    {
        question: "Who was the prophet who went to heaven in a chariot of fire?",
        options: ["Elisha", "Elijah", "Isaiah", "Jeremiah"],
        answer: 1
    },
    {
        question: "Who was the queen who saved the Jewish people from Haman's plot?",
        options: ["Ruth", "Esther", "Deborah", "Jezebel"],
        answer: 1
    },
    {
        question: "What is the last word in the Bible?",
        options: ["Hallelujah", "Amen", "Lord", "Forever"],
        answer: 1
    },
    {
        question: "Who was the brother of Mary and Martha whom Jesus raised from the dead?",
        options: ["Lazarus", "Simon", "John", "Nicodemus"],
        answer: 0
    },
    {
        question: "What instrument did David play to soothe King Saul?",
        options: ["Flute", "Harp", "Trumpet", "Lyre"],
        answer: 1
    },
    {
        question: "Who was the female judge of Israel who led them to victory over Sisera?",
        options: ["Ruth", "Deborah", "Esther", "Miriam"],
        answer: 1
    },
    {
        question: "What is the fruit of the Spirit mentioned first in Galatians 5?",
        options: ["Joy", "Peace", "Love", "Patience"],
        answer: 2
    },
    {
        question: "How many fruits of the Spirit are listed in Galatians 5?",
        options: ["7", "9", "12", "10"],
        answer: 1
    },
    {
        question: "Who was the prophet swallowed by the fish for refusing to go to Nineveh?",
        options: ["Jonah", "Elijah", "Isaiah", "Amos"],
        answer: 0
    },
    {
        question: "Complete the quote: 'Apostle Joshua Selman: True honor is not just a gesture, it is a state of ___.'",
        options: ["surrender", "alignment", "respect", "heart"],
        answer: 1
    },
    {
        question: "Complete the quote: 'Apostle Joshua Selman: God's power always follows His ___.'",
        options: ["will", "command", "presence", "grace"],
        answer: 2
    }
];

const SESSION_KEY = 'security_check_session_v2';
const EXPIRY_HOURS = 24;

function getSessionCounts() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) {
            return { locationCount: 0, deviceIdCount: 0, timestamp: Date.now() };
        }

        const data = JSON.parse(raw);
        const hoursPassed = (Date.now() - (data.timestamp || 0)) / (1000 * 60 * 60);

        if (hoursPassed > EXPIRY_HOURS) {
            const reset = { locationCount: 0, deviceIdCount: 0, timestamp: Date.now() };
            localStorage.setItem(SESSION_KEY, JSON.stringify(reset));
            return reset;
        }

        return {
            locationCount: Number(data.locationCount) || 0,
            deviceIdCount: Number(data.deviceIdCount) || 0,
            timestamp: Number(data.timestamp) || Date.now()
        };
    } catch (err) {
        console.warn('Failed to read security counts:', err);
        return { locationCount: 0, deviceIdCount: 0, timestamp: Date.now() };
    }
}

function saveSessionCounts(counts: { locationCount: number; deviceIdCount: number }) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            ...counts,
            timestamp: Date.now()
        }));
    } catch (err) {
        console.warn('Failed to save security counts:', err);
    }
}

interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

function CircularProgress({ percentage, size = 68, strokeWidth = 6, color = "var(--accent-primary)" }: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="circular-progress-wrapper" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <circle
                    stroke="rgba(255, 255, 255, 0.05)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeLinecap="round"
                />
            </svg>
            <div className="circular-progress-text" style={{ color }}>
                {percentage}%
            </div>
        </div>
    );
}

// Confetti Burst Effect
const ConfettiBurst = () => {
    const particles = Array.from({ length: 30 });
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
            {particles.map((_, i) => {
                const angle = (i / 30) * 360 + Math.random() * 20;
                const distance = 80 + Math.random() * 120;
                const x = Math.cos(angle * Math.PI / 180) * distance;
                const y = Math.sin(angle * Math.PI / 180) * distance;
                const size = 6 + Math.random() * 10;
                const colors = ['var(--accent-primary)', '#34C759', '#0A84FF', '#FF2D55', '#AF52DE'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                return (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            backgroundColor: randomColor,
                            zIndex: 100
                        }}
                        initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
                        animate={{
                            x,
                            y,
                            scale: [1, 0.8, 0],
                            opacity: [1, 1, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            ease: "easeOut",
                        }}
                    />
                );
            })}
        </div>
    );
};

// Skeleton Shimmer Dashboard Loader
function SkeletonDashboard() {
    return (
        <div className="user-dashboard-modern skeleton-dashboard">
            <div className="skeleton-line scripture-shimmer" />
            <div className="user-dashboard-modern__layout">
                <div className="user-dashboard-modern__col">
                    <div className="skeleton-card hero-shimmer" />
                    <div className="skeleton-card checkin-shimmer" />
                    <div className="user-dashboard-modern__metrics">
                        <div className="skeleton-card metric-shimmer" />
                        <div className="skeleton-card metric-shimmer" />
                    </div>
                </div>
                <div className="user-dashboard-modern__col">
                    <div className="skeleton-card roster-shimmer" />
                    <div className="skeleton-card shortcuts-shimmer" />
                </div>
            </div>
        </div>
    );
}

// Custom Monthly Serving Streak Calendar Component
function StreakCalendar({ history }: { history: AttendanceRecord[] }) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDayStatus = (dayNum: number) => {
        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const record = history.find(r => r.date.split('T')[0] === targetDateStr);
        if (record) return 'present';

        const dayOfWeek = new Date(year, month, dayNum).getDay();
        
        // Remove time comparison to only look at day dates
        const comparisonToday = new Date(today);
        comparisonToday.setHours(0, 0, 0, 0);
        const cellDate = new Date(year, month, dayNum);
        cellDate.setHours(0,0,0,0);
        
        if (cellDate > comparisonToday) return 'future';

        if (dayOfWeek === 0 || dayOfWeek === 3) {
            return 'absent';
        }
        return 'none';
    };

    const checkInsThisMonth = history.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    const daysOfWeekHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="streak-calendar">
            <div className="streak-calendar__header">
                <span className="streak-calendar__title">{monthNames[month]} {year}</span>
                <span className="streak-calendar__badge">
                    🔥 {checkInsThisMonth} Streak Logs
                </span>
            </div>
            
            <div className="streak-calendar__days-header">
                {daysOfWeekHeaders.map((d, i) => (
                    <div key={i} className="day-header-cell">{d}</div>
                ))}
            </div>

            <div className="streak-calendar__grid">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-cell empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const status = getDayStatus(dayNum);
                    let cellClass = `calendar-cell ${status}`;
                    if (dayNum === today.getDate()) {
                        cellClass += ' is-today';
                    }

                    return (
                        <div key={dayNum} className={cellClass}>
                            <span className="day-num">{dayNum}</span>
                            {status === 'present' && <span className="status-dot present" />}
                            {status === 'absent' && <span className="status-dot absent" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Real-Time Service Timeline Component
function RosterTimeline() {
    const [activeTab, setActiveTab] = useState<'sunday' | 'wednesday'>(() => {
        const today = new Date().getDay();
        return today === 3 ? 'wednesday' : 'sunday';
    });

    const [isKsom, setIsKsom] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getCountdown = (targetHour: number, targetMin: number) => {
        const target = new Date(currentTime);
        target.setHours(targetHour, targetMin, 0, 0);

        const diffMs = target.getTime() - currentTime.getTime();
        if (diffMs <= 0) return 'Passed';

        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;

        const pad = (num: number) => String(num).padStart(2, '0');
        if (hours > 0) {
            return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
        }
        return `${pad(mins)}m ${pad(secs)}s`;
    };

    const isTabToday = (tab: 'sunday' | 'wednesday') => {
        const today = new Date().getDay();
        return (tab === 'sunday' && today === 0) || (tab === 'wednesday' && today === 3);
    };

    return (
        <div className="roster-timeline glass-sm">
            <div className="roster-timeline__tabs">
                <button
                    className={`timeline-tab-btn ${activeTab === 'sunday' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sunday')}
                >
                    Sunday Schedule {isTabToday('sunday') && <span className="today-badge">Today</span>}
                </button>
                <button
                    className={`timeline-tab-btn ${activeTab === 'wednesday' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wednesday')}
                >
                    Wednesday Schedule {isTabToday('wednesday') && <span className="today-badge">Today</span>}
                </button>
            </div>

            {activeTab === 'sunday' && (
                <div className="timeline-steps">
                    {/* Resumption */}
                    <div className="timeline-step">
                        <div className="timeline-node active">
                            <span className="node-dot" />
                            <span className="node-line" />
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-time">9:00 AM</div>
                            <h4 className="timeline-title">Cleaning & Resumption</h4>
                            <p className="timeline-desc">Sanctuary preparation check-ins. Closing countdown for cleaning groups:</p>
                            <div className="timeline-meta">
                                <span className="countdown-value">{getCountdown(10, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Basement Prayers */}
                    <div className="timeline-step">
                        <div className="timeline-node active">
                            <span className="node-dot" />
                            <span className="node-line" />
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-time">2:00 PM</div>
                            <h4 className="timeline-title">Basement Prayers</h4>
                            <p className="timeline-desc">Intercessory prayers for ushers in the basement. Countdown to completion:</p>
                            <div className="timeline-meta">
                                <span className="countdown-value">{getCountdown(15, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Duty Posts */}
                    <div className="timeline-step last">
                        <div className="timeline-node">
                            <span className="node-dot" />
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-time">4:30 PM</div>
                            <h4 className="timeline-title">Duty Posts</h4>
                            <p className="timeline-desc">All ushers stationed at allocated positions. Sanctuary doors fully open.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'wednesday' && (
                <div className="timeline-steps">
                    <div className="ksom-toggle-bar">
                        <span className="ksom-toggle-label">KSOM in Session?</span>
                        <button 
                            className={`ksom-toggle-btn ${isKsom ? 'active' : ''}`}
                            onClick={() => setIsKsom(!isKsom)}
                        >
                            {isKsom ? 'Yes (4:30 PM)' : 'No (5:00 PM)'}
                        </button>
                    </div>

                    {/* Weekly Meeting */}
                    <div className="timeline-step">
                        <div className="timeline-node active">
                            <span className="node-dot" />
                            <span className="node-line" />
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-time">{isKsom ? '4:30 PM' : '5:00 PM'}</div>
                            <h4 className="timeline-title">Weekly Meeting Resumption</h4>
                            <p className="timeline-desc">Check-in starts. Alignment briefing. Late check-in cutoff countdown:</p>
                            <div className="timeline-meta">
                                <span className="countdown-value">{getCountdown(18, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Late Cutoff */}
                    <div className="timeline-step last">
                        <div className="timeline-node">
                            <span className="node-dot" />
                        </div>
                        <div className="timeline-content">
                            <div className="timeline-time">6:00 PM</div>
                            <h4 className="timeline-title">Late Cutoff</h4>
                            <p className="timeline-desc">Check-ins closed. Defaults are calculated after this hour.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Accent Color Theme Selector Component
function ThemeSelector() {
    const accentColor = useAuthStore((state) => state.accentColor) || 'gold';
    const setAccentColor = useAuthStore((state) => state.setAccentColor);

    const themes = [
        { id: 'gold', name: 'Gold', color: '#D4AF37' },
        { id: 'blue', name: 'Blue', color: '#0A84FF' },
        { id: 'green', name: 'Green', color: '#34C759' },
        { id: 'purple', name: 'Purple', color: '#AF52DE' }
    ];

    return (
        <div className="theme-selector">
            <h3 className="theme-selector__title">Custom Theme Accent</h3>
            <div className="theme-selector__grid">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => {
                            setAccentColor(t.id);
                            toast.success(`Theme switched to ${t.name}!`);
                        }}
                        className={`theme-selector__btn theme-selector__btn--${t.id} ${accentColor === t.id ? 'active' : ''}`}
                    >
                        <span className="color-dot" style={{ backgroundColor: t.color }} />
                        <span className="color-name">{t.name}</span>
                        {accentColor === t.id && <Check size={12} className="check-icon" />}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function UserDashboardPage() {
    const { user, token } = useAuthStore();
    const [attendanceData, setAttendanceData] = useState<UserAttendance | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [scriptureIndex, setScriptureIndex] = useState(0);
    const [showStrikeInfo, setShowStrikeInfo] = useState(false);
    const navigate = useNavigate();

    // ── Security check state ──────────────────────────────────────────────────
    const [locationWarning, setLocationWarning] = useState<{
        distanceMeters: number;
        venueName: string;
    } | null>(null);
    const [locationDismissCount, setLocationDismissCount] = useState(0);
    const [rechecking, setRechecking] = useState(false);

    const [showDeviceIdWarning, setShowDeviceIdWarning] = useState(false);
    const [deviceIdDismissCount, setDeviceIdDismissCount] = useState(0);

    const securityChecked = useRef(false);

    // ─── Check-in success dynamic overlay state ──────────────────────────────
    const [checkInSuccessData, setCheckInSuccessData] = useState<{
        badge?: string;
        badgeIcon?: string;
        message: string;
        funny?: boolean;
    } | null>(null);

    // ─── Quiz Game State ──────────────────────────────────────────────────────
    const [gameStarted, setGameStarted] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [quizFinished, setQuizFinished] = useState(false);

    // Start the Quiz
    const startQuiz = () => {
        const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
        setQuizQuestions(shuffled.slice(0, 5));
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setTimeLeft(15);
        setQuizFinished(false);
        setGameStarted(true);
    };

    // Timer logic
    useEffect(() => {
        if (!gameStarted || quizFinished || selectedAnswer !== null) return;

        if (timeLeft === 0) {
            handleAnswerSelect(-1);
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, gameStarted, quizFinished, selectedAnswer]);

    // Answer selection
    const handleAnswerSelect = (optionIndex: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionIndex);

        const currentQuestion = quizQuestions[currentQuestionIndex];
        const correct = optionIndex === currentQuestion.answer;

        if (correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex + 1 < quizQuestions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setTimeLeft(15);
            } else {
                setQuizFinished(true);
            }
        }, 2000);
    };

    // Rotating scriptures
    useEffect(() => {
        const timer = setInterval(() => {
            setScriptureIndex((prev) => (prev + 1) % SCRIPTURES.length);
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    // Time-based greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Wednesday/Sunday check-in evaluation
    const triggerSuccessOverlay = () => {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 3 = Wednesday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeInMinutes = hours * 60 + minutes;

        let badge: string | undefined = undefined;
        let badgeIcon: string | undefined = undefined;
        let message = "Your attendance has been recorded successfully.";
        let funny = false;

        if (day === 3) {
            // Wednesday Early Bird: 4:30 PM (16:30) to 4:45 PM (16:45)
            if (timeInMinutes >= 16 * 60 + 30 && timeInMinutes <= 16 * 60 + 45) {
                badge = "Early Bird";
                badgeIcon = "⚡";
                message = "Wednesday Early Bird! Punctuality is the soul of service. You have earned the Punctual Servant badge!";
            } else if (timeInMinutes >= 18 * 60) {
                // Wednesday late sign-in warning: from 6:00 PM (18:00) onwards
                funny = true;
                message = "You are so lucky you would have forgotten to sign in! Thank God for the reminder.";
            }
        } else if (day === 0) {
            // Sunday Early Bird: before 9:30 AM (09:30)
            if (timeInMinutes < 9 * 60 + 30) {
                badge = "Sunday Vanguard";
                badgeIcon = "🌟";
                message = "Sunday Vanguard! Early to the sanctuary, early to the altar. You have earned the Sunday Punctuality badge!";
            } else if (timeInMinutes >= 17 * 60) {
                // Sunday late sign-in warning: after 5:00 PM (17:00)
                funny = true;
                message = "That's how you would have forgotten and be so busy serving! We are glad you signed in.";
            }
        }

        setCheckInSuccessData({
            badge,
            badgeIcon,
            message,
            funny
        });
    };

    // ── Run security checks once on mount ────────────────────────────────────
    useEffect(() => {
        if (!user || securityChecked.current) return;
        securityChecked.current = true;

        const counts = getSessionCounts();

        const localDeviceId = getDeviceId();
        const serverDeviceId = (user as any)?.device_id as string | undefined;

        if (
            serverDeviceId &&
            localDeviceId !== serverDeviceId &&
            counts.deviceIdCount < 2
        ) {
            setShowDeviceIdWarning(true);
            setDeviceIdDismissCount(counts.deviceIdCount);
        }

        if (navigator.geolocation && counts.locationCount < 2) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const result = getNearestVenue(pos.coords.latitude, pos.coords.longitude);
                    if (!result.isWithin) {
                        setLocationWarning({
                            distanceMeters: result.distanceMeters,
                            venueName: result.name,
                        });
                        setLocationDismissCount(counts.locationCount);
                    }
                },
                () => {},
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000,
                }
            );
        }
    }, [user]);

    const handleLocationRecheck = () => {
        setRechecking(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const result = getNearestVenue(pos.coords.latitude, pos.coords.longitude);
                setRechecking(false);

                if (result.isWithin) {
                    setLocationWarning(null);
                    const counts = getSessionCounts();
                    saveSessionCounts({ ...counts, locationCount: counts.locationCount + 1 });
                } else {
                    setLocationWarning({
                        distanceMeters: result.distanceMeters,
                        venueName: result.name,
                    });
                    const newCount = locationDismissCount + 1;
                    setLocationDismissCount(newCount);
                    const counts = getSessionCounts();
                    saveSessionCounts({ ...counts, locationCount: newCount });
                }
            },
            () => {
                setRechecking(false);
                const newCount = locationDismissCount + 1;
                setLocationDismissCount(newCount);
                const counts = getSessionCounts();
                saveSessionCounts({ ...counts, locationCount: newCount });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleLocationDismiss = () => {
        setLocationWarning(null);
        const counts = getSessionCounts();
        saveSessionCounts({ ...counts, locationCount: 2 });
    };

    const handleDeviceIdDismiss = () => {
        const newCount = deviceIdDismissCount + 1;
        if (newCount >= 2) {
            setShowDeviceIdWarning(false);
            const counts = getSessionCounts();
            saveSessionCounts({ ...counts, deviceIdCount: 2 });
        } else {
            setDeviceIdDismissCount(newCount);
            const counts = getSessionCounts();
            saveSessionCounts({ ...counts, deviceIdCount: newCount });
        }
    };

    // ── Dashboard data load ───────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!user || !token) return;

            setLoading(true);

            try {
                try {
                    const attendanceResponse = await analyticsAPI.getUserAttendance(user.id, token);
                    setAttendanceData(attendanceResponse.data);
                } catch {
                    setAttendanceData({
                        user,
                        history: [],
                        summary: { total_days: 0, days_present: 0, rate: 0 },
                    });
                }

                try {
                    const eventsResponse = await eventsAPI.getUpcoming(token);
                    setUpcomingEvents(eventsResponse);
                } catch {
                    setUpcomingEvents([]);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, token]);

    const handleCheckIn = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check in');
            return;
        }

        if (hasDeviceCheckedInToday()) {
            toast.error("You've already checked in today");
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckingIn(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const deviceId = getDeviceId();

                    await attendanceAPI.checkIn(
                        {
                            location: { lat: latitude, lng: longitude },
                            device_id: deviceId,
                        },
                        token
                    );

                    recordDeviceCheckIn(user.id);
                    toast.success('Checked in successfully');
                    triggerSuccessOverlay();

                    try {
                        const updatedData = await analyticsAPI.getUserAttendance(user.id, token);
                        setAttendanceData(updatedData.data);
                    } catch {}
                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-in failed, please try again'
                    );
                } finally {
                    setCheckingIn(false);
                }
            },
            (error) => {
                setCheckingIn(false);
                let message = 'Unable to access your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location unavailable. Try again.';
                        break;
                    case error.TIMEOUT:
                        message += 'Request timed out. Try again.';
                        break;
                    default:
                        message += 'Please ensure location services are enabled.';
                }
                toast.error(message);
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: Infinity,
            }
        );
    };

    const handleCheckOut = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check out');
            return;
        }

        if (hasDeviceCheckedOutToday()) {
            toast.error("You've already checked out today");
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckingOut(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const deviceId = getDeviceId();

                    await attendanceAPI.signOut(
                        {
                            location: { lat: latitude, lng: longitude },
                            device_id: deviceId,
                        },
                        token
                    );

                    recordDeviceCheckOut(user.id);
                    toast.success('Checked out successfully');
                    setCheckInSuccessData({
                        message: "Checked out successfully. Thank you for your service today!",
                        funny: false
                    });

                    try {
                        const updatedData = await analyticsAPI.getUserAttendance(user.id, token);
                        setAttendanceData(updatedData.data);
                    } catch {}
                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-out failed, please try again'
                    );
                } finally {
                    setCheckingOut(false);
                }
            },
            () => {
                setCheckingOut(false);
                let message = 'Unable to access your location. ';
                toast.error(message);
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: Infinity }
        );
    };

    const activeTheme = useAuthStore((state) => state.accentColor) || 'gold';

    // Map color variables
    const accentPalettes = {
        gold: { primary: '#D4AF37', secondary: 'rgba(212, 175, 55, 0.15)', glow: 'rgba(212, 175, 55, 0.3)' },
        blue: { primary: '#0A84FF', secondary: 'rgba(10, 132, 255, 0.15)', glow: 'rgba(10, 132, 255, 0.3)' },
        green: { primary: '#34C759', secondary: 'rgba(52, 199, 89, 0.15)', glow: 'rgba(52, 199, 89, 0.3)' },
        purple: { primary: '#AF52DE', secondary: 'rgba(175, 82, 222, 0.15)', glow: 'rgba(175, 82, 222, 0.3)' }
    };

    const colors = accentPalettes[activeTheme as keyof typeof accentPalettes] || accentPalettes.gold;
    const dynamicVars = {
        '--accent-primary': colors.primary,
        '--accent-secondary': colors.secondary,
        '--accent-glow': colors.glow
    } as React.CSSProperties;

    if (loading) {
        return <SkeletonDashboard />;
    }

    const attendanceRate = attendanceData?.summary
        ? Math.round(attendanceData.summary.rate)
        : 0;
    const daysPresent = attendanceData?.summary?.days_present || 0;
    const totalDays = attendanceData?.summary?.total_days || 0;

    let rosterHall = (user as any)?.current_roster_hall;
    let rosterAllocation = (user as any)?.current_roster_allocation;

    if (rosterHall) rosterHall = rosterHall.replace(/^"|"$/g, '');
    if (rosterAllocation) rosterAllocation = rosterAllocation.replace(/^"|"$/g, '');
    const isRosterActive = !!rosterHall;

    return (
        <div className="user-dashboard-modern" style={dynamicVars}>
            {/* Soft Ambient Background Orbs */}
            <div className="user-dashboard-modern__bg">
                <div className="user-dashboard-modern__orb user-dashboard-modern__orb--gold" />
                <div className="user-dashboard-modern__orb user-dashboard-modern__orb--blue" />
            </div>

            {/* ── Security Modals ─────────────────────────────────────────── */}
            <AnimatePresence>
                {locationWarning && (
                    <LocationWarningModal
                        key="location-warning"
                        distanceMeters={locationWarning.distanceMeters}
                        venueName={locationWarning.venueName}
                        dismissCount={locationDismissCount}
                        onRecheck={handleLocationRecheck}
                        onDismiss={handleLocationDismiss}
                        rechecking={rechecking}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeviceIdWarning && (
                    <DeviceIdWarningModal
                        key="device-id-warning"
                        dismissCount={deviceIdDismissCount}
                        onDismiss={handleDeviceIdDismiss}
                    />
                )}
            </AnimatePresence>

            {/* Check-in Success Modal with Confetti Burst */}
            <AnimatePresence>
                {checkInSuccessData && (
                    <div className="security-modal-overlay security-modal-overlay--top">
                        <motion.div 
                            className="security-modal success-modal glass-strong"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{ position: 'relative', overflow: 'visible' }}
                        >
                            <ConfettiBurst />
                            
                            <div className="success-modal__header">
                                <Trophy size={36} color="var(--accent-primary)" className="success-modal__trophy" />
                                <button 
                                    className="success-modal__close-btn"
                                    onClick={() => setCheckInSuccessData(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="security-modal__body success-modal__body">
                                {checkInSuccessData.badge && (
                                    <div className="success-modal__badge-card">
                                        <span className="badge-icon">{checkInSuccessData.badgeIcon}</span>
                                        <div>
                                            <h4 className="badge-title">Milestone Unlocked!</h4>
                                            <p className="badge-name">{checkInSuccessData.badge}</p>
                                        </div>
                                    </div>
                                )}

                                <h3 className="success-modal__title">
                                    {checkInSuccessData.funny ? "Whew! Safe Sign-In!" : "Attendance Logged!"}
                                </h3>
                                <p className="success-modal__desc">
                                    {checkInSuccessData.message}
                                </p>
                            </div>

                            <div className="security-modal__footer success-modal__footer">
                                <button 
                                    className="security-modal__btn success-modal__btn-done"
                                    onClick={() => setCheckInSuccessData(null)}
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scripture Banner */}
            <div className="user-dashboard-modern__scripture glass-strong">
                <div className="user-dashboard-modern__scripture-icon">
                    <BookOpen size={24} color="var(--accent-primary)" />
                </div>
                <div className="user-dashboard-modern__scripture-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={scriptureIndex}
                            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                            transition={{ duration: 0.5 }}
                        >
                            <p className="user-dashboard-modern__scripture-text">
                                "{SCRIPTURES[scriptureIndex].text}"
                            </p>
                            <span className="user-dashboard-modern__scripture-ref">
                                — {SCRIPTURES[scriptureIndex].ref}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="user-dashboard-modern__layout">
                {/* Left Column: Welcoming Card, Check-In Card, RosterTimeline, Metrics */}
                <div className="user-dashboard-modern__col">
                    {/* Welcome Card */}
                    <motion.section 
                        className="user-dashboard-modern__hero glass-strong"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="user-dashboard-modern__hero-header">
                            <div className="user-dashboard-modern__avatar-wrapper">
                                <Crown className="crown-badge" size={18} />
                                <div className="user-avatar-circle">
                                    {user?.first_name ? user.first_name[0] : 'U'}
                                </div>
                            </div>
                            <div className="user-dashboard-modern__hero-meta">
                                <span className="user-dashboard-modern__badge">Member Portal</span>
                                <h1 className="user-dashboard-modern__title">
                                    {getGreeting()}, <span className="user-dashboard-modern__title--accent">{user?.first_name}</span>
                                </h1>
                                <p className="user-dashboard-modern__tagline">Usher with a Difference</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Duty status & Check-in Desk */}
                    <motion.section 
                        className="user-dashboard-modern__checkin glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="user-dashboard-modern__checkin-info">
                            <div className={`user-dashboard-modern__pulse ${hasDeviceCheckedInToday() ? 'active' : 'idle'}`} />
                            <div>
                                <h3 className="user-dashboard-modern__checkin-title">
                                    {hasDeviceCheckedInToday() ? 'On Duty' : 'Ready for Duty'}
                                </h3>
                                <p className="user-dashboard-modern__checkin-subtitle">
                                    {hasDeviceCheckedInToday() ? 'Thank you for your service today!' : 'Please check in to record your attendance'}
                                </p>
                            </div>
                        </div>

                        <div className="user-dashboard-modern__checkin-btn-wrapper">
                            {user?.is_cleaning_day && hasDeviceCheckedInToday() ? (
                                <button
                                    onClick={handleCheckOut}
                                    disabled={checkingOut || !!hasDeviceCheckedOutToday()}
                                    className={`checkin-button checkin-button--checkout ${hasDeviceCheckedOutToday() ? 'disabled' : ''}`}
                                >
                                    <CheckCircle2 size={32} />
                                    <span>{checkingOut ? 'Checking out...' : hasDeviceCheckedOutToday() ? 'Checked Out' : 'Check Out'}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checkingIn || !!hasDeviceCheckedInToday()}
                                    className={`checkin-button ${hasDeviceCheckedInToday() ? 'disabled' : ''}`}
                                >
                                    <CheckCircle2 size={32} />
                                    <span>{checkingIn ? 'Checking in...' : hasDeviceCheckedInToday() ? 'Checked In' : 'Check In'}</span>
                                </button>
                            )}
                        </div>
                    </motion.section>

                    {/* Real-time Serving Timelines */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <RosterTimeline />
                    </motion.section>

                    {/* Metrics Grid */}
                    <div className="user-dashboard-modern__metrics">
                        <motion.div 
                            className="user-dashboard-modern__metric-card glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <CircularProgress percentage={attendanceRate} color="var(--accent-primary)" />
                            <div className="metric-info">
                                <span className="user-dashboard-modern__metric-lbl">Attendance Rate</span>
                                <span className="user-dashboard-modern__metric-detail">{daysPresent} of {totalDays} days</span>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="user-dashboard-modern__metric-card glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                        >
                            <div className="metric-progress-container">
                                <div className="metric-progress-header">
                                    <span className="user-dashboard-modern__metric-lbl">Days Present</span>
                                    <span className="user-dashboard-modern__metric-val">{daysPresent} <span className="total">/ {totalDays}</span></span>
                                </div>
                                <div className="metric-progress-bar-bg">
                                    <motion.div 
                                        className="metric-progress-bar-fill" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${totalDays > 0 ? (daysPresent / totalDays) * 100 : 0}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Strike Count Card */}
                    <motion.div 
                        className="user-dashboard-modern__strike glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="user-dashboard-modern__strike-main">
                            <div className="user-dashboard-modern__strike-icon">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="user-dashboard-modern__strike-content">
                                <div className="user-dashboard-modern__strike-val">{(user as any)?.strike ?? 0}</div>
                                <div className="user-dashboard-modern__strike-lbl">Active Strikes</div>
                            </div>
                            <button
                                className="user-dashboard-modern__strike-info-btn"
                                onClick={() => setShowStrikeInfo(!showStrikeInfo)}
                                title="Strike Info"
                            >
                                <Info size={16} />
                            </button>
                        </div>
                        <AnimatePresence>
                            {showStrikeInfo && (
                                <motion.div
                                    className="user-dashboard-modern__strike-info-panel"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <p>
                                        A <strong>strike</strong> represents the number of times you have defaulted. 
                                        Accumulating 3 strikes is the highest limit and may lead to disciplinary action. 
                                        Please ensure guidelines are maintained for a clean record.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Right Column: Roster, Quick Links, Events, StreakCalendar, ThemeSelector */}
                <div className="user-dashboard-modern__col">
                    {/* Roster Assignment */}
                    <motion.section 
                        className="user-dashboard-modern__panel glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <h2 className="user-dashboard-modern__section-title">Roster Assignment</h2>
                        <div className={`user-dashboard-modern__roster ${isRosterActive ? 'active' : 'pending'}`}>
                            <div className="user-dashboard-modern__roster-header">
                                <div className="user-dashboard-modern__roster-icon">
                                    {isRosterActive ? <MapPin size={22} /> : <Info size={22} />}
                                </div>
                                <span className="user-dashboard-modern__roster-badge">
                                    {isRosterActive ? 'Assigned' : 'Pending'}
                                </span>
                            </div>
                            <div className="user-dashboard-modern__roster-content">
                                {isRosterActive ? (
                                    <>
                                        <h3 className="user-dashboard-modern__roster-hall">{rosterHall}</h3>
                                        <p className="user-dashboard-modern__roster-allocation">
                                            <User size={14} />
                                            <span>{rosterAllocation || 'Member'}</span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="user-dashboard-modern__roster-hall">No Hall Assigned</h3>
                                        <p className="user-dashboard-modern__roster-allocation">
                                            Please check back later for your allocation.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.section>

                    {/* Quick portal shortcut links */}
                    <motion.section 
                        className="user-dashboard-modern__panel glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="user-dashboard-modern__section-title">Quick Shortcuts</h2>
                        <div className="user-dashboard-modern__shortcuts">
                            <button onClick={() => navigate('/events')} className="user-dashboard-modern__shortcut-btn glass-md">
                                <Calendar size={18} />
                                <span>Events Calendar</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/koinonia')} className="user-dashboard-modern__shortcut-btn glass-md">
                                <Music size={18} />
                                <span>Koinonia Sermons</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/kud-sermons')} className="user-dashboard-modern__shortcut-btn glass-md">
                                <Music size={18} />
                                <span>KUD Sermons</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/payments')} className="user-dashboard-modern__shortcut-btn glass-md">
                                <DollarSign size={18} />
                                <span>Contributions</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/profile')} className="user-dashboard-modern__shortcut-btn glass-md">
                                <User size={18} />
                                <span>Profile Settings</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                        </div>
                    </motion.section>

                    {/* Custom Streak Calendar Visualizer */}
                    {attendanceData?.history && (
                        <motion.section
                            className="user-dashboard-modern__panel glass"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.22 }}
                        >
                            <StreakCalendar history={attendanceData.history} />
                        </motion.section>
                    )}

                    {/* Theme Selector */}
                    <motion.section
                        className="user-dashboard-modern__panel glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.24 }}
                    >
                        <ThemeSelector />
                    </motion.section>

                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <motion.section 
                            className="user-dashboard-modern__panel glass"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.26 }}
                        >
                            <h2 className="user-dashboard-modern__section-title">Upcoming Events</h2>
                            <div className="user-dashboard-modern__events">
                                {upcomingEvents.slice(0, 2).map((event) => (
                                    <div key={event.id} className="user-dashboard-modern__event-card glass-sm">
                                        <div className="user-dashboard-modern__event-header">
                                            <h4>{event.title}</h4>
                                            <span className="user-dashboard-modern__event-type">{event.attendance_type}</span>
                                        </div>
                                        <div className="user-dashboard-modern__event-meta">
                                            <p><Calendar size={12} /> {new Date(event.date).toLocaleDateString()} · {event.time}</p>
                                            <p><MapPin size={12} /> {event.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Recent Check-ins */}
                    {attendanceData?.history && attendanceData.history.length > 0 && (
                        <motion.section 
                            className="user-dashboard-modern__panel glass"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.28 }}
                        >
                            <h2 className="user-dashboard-modern__section-title">Recent Check-ins</h2>
                            <div className="user-dashboard-modern__history">
                                {attendanceData.history.slice(0, 3).map((record) => (
                                    <div key={record.id} className="user-dashboard-modern__history-item glass-sm">
                                        <span className="date">
                                            {new Date(record.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                        <span className="time"><Clock size={12} /> {record.time_in}</span>
                                        <span className="status">{record.marked_by ? 'Verified' : 'Self'}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>
            </div>

            {/* Christian Quiz Game Section */}
            <motion.section 
                className="user-dashboard-modern__game glass-strong"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="game-header">
                    <Trophy size={28} color="var(--accent-primary)" className="game-header__trophy" />
                    <div>
                        <h2 className="game-title">Koinonia Global Quiz</h2>
                        <p className="game-subtitle">Test your knowledge of the ministry & Bible facts! 15 seconds per question.</p>
                    </div>
                </div>

                {!gameStarted && !quizFinished && (
                    <div className="game-start-view">
                        <HelpCircle size={48} className="game-start-icon" />
                        <button onClick={startQuiz} className="game-start-btn">
                            <Play size={18} />
                            <span>Start Quiz</span>
                        </button>
                    </div>
                )}

                {gameStarted && !quizFinished && quizQuestions.length > 0 && (
                    <div className="game-quiz-view">
                        <div className="quiz-meta">
                            <span className="quiz-progress">Question {currentQuestionIndex + 1} of 5</span>
                            <div className="quiz-timer">
                                <Clock size={16} />
                                <span className={timeLeft <= 5 ? 'timer-warning' : ''}>{timeLeft}s</span>
                            </div>
                        </div>

                        {/* Timer Progress Bar */}
                        <div className="timer-bar-container">
                            <motion.div 
                                className="timer-bar"
                                style={{ width: `${(timeLeft / 15) * 100}%` }}
                                animate={{
                                    backgroundColor: timeLeft <= 5 ? '#EF4444' : 'var(--accent-primary)'
                                }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </div>

                        <h3 className="quiz-question">{quizQuestions[currentQuestionIndex].question}</h3>

                        <div className="quiz-options">
                            {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                                let optionClass = "quiz-option-btn";
                                if (selectedAnswer !== null) {
                                    if (idx === quizQuestions[currentQuestionIndex].answer) {
                                        optionClass += " correct";
                                    } else if (idx === selectedAnswer) {
                                        optionClass += " incorrect";
                                    } else {
                                        optionClass += " dim";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerSelect(idx)}
                                        disabled={selectedAnswer !== null}
                                        className={optionClass}
                                    >
                                        <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                                        <span className="option-text">{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {quizFinished && (
                    <div className="game-result-view">
                        <Trophy size={64} className="result-trophy" />
                        <h3 className="result-title">Quiz Completed!</h3>
                        <p className="result-score">You scored <strong>{score}</strong> out of 5</p>
                        <p className="result-message">
                            {score === 5 ? "Excellent! You are a Koinonia Global scholar! 🌟" :
                             score >= 3 ? "Good job! Keep learning and serving! 👍" :
                             "Nice try! Test your knowledge again to get a higher score! 🙏"}
                        </p>
                        <button onClick={startQuiz} className="game-restart-btn">
                            <RotateCcw size={18} />
                            <span>Play Again</span>
                        </button>
                    </div>
                )}
            </motion.section>

            <SuggestionBox />
        </div>
    );
}