import { motion } from 'framer-motion';
import { ExternalLink, Music } from 'lucide-react';
import { Card } from '../components/ui/Card';
import './KoinoniaPage.css';

interface SermonLink {
    title: string;
    year: number;
    url: string;
}

const SERMON_LINKS: SermonLink[] = [
    {
        title: 'Koinonia Audio 2011',
        year: 2011,
        url: 'https://drive.google.com/drive/folders/1TCGw2bCd18Ky6QSXX4WH0mkWgiA-6Vsl?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2012',
        year: 2012,
        url: 'https://drive.google.com/drive/folders/12GOXpO5OjOWjJQnGDtdRqqmPDq4ricU6?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2013',
        year: 2013,
        url: 'https://drive.google.com/drive/folders/1pA9KzE-kNV52mGiFdVUmFl2etDmrapnr?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2014',
        year: 2014,
        url: 'https://drive.google.com/drive/folders/1KOR4CJklRzGcWJGEQfzlr_rDg3mJOwyC?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2015',
        year: 2015,
        url: 'https://drive.google.com/drive/folders/1oU6wQQJigWVYBNHMZ-Vuda23959rX61J?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2016',
        year: 2016,
        url: 'https://drive.google.com/drive/folders/17SXr7QrjHrd4H0vRJTVjipU7iYgwxLaE?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2017',
        year: 2017,
        url: 'https://drive.google.com/drive/folders/1B2ZmAqR3AZbCdGxWUdBf1oJviR6_K14K?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2018',
        year: 2018,
        url: 'https://drive.google.com/drive/folders/1iWEVA_jOcRFwqaAWjYyIwUAt5IHDonFy?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2019',
        year: 2019,
        url: 'https://drive.google.com/drive/folders/15_Xyu1ZoyHutIySRTEZbfvXzYoBxjht5?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2020',
        year: 2020,
        url: 'https://drive.google.com/drive/folders/1aymlpftwpaeFqFULxR7-3Hccq3vjCvkq?usp=sharing',
    },
    {
        title: 'Koinonia Audio 2021',
        year: 2021,
        url: 'https://bit.ly/3Eu10nF',
    },
    {
        title: 'Koinonia Audio 2022',
        year: 2022,
        url: 'https://bit.ly/37UzHrD',
    },
    {
        title: 'Koinonia Audio 2023',
        year: 2023,
        url: 'https://drive.google.com/drive/mobile/folders/1-A8h9ZioJtW3W5pBfMWk2dMzkKCjTImB',
    },
    {
        title: 'Koinonia Audio 2024',
        year: 2024,
        url: 'https://drive.google.com/drive/folders/10vcgZQxthzVVynyYhhCzgmj7Dat2aseO',
    },
    {
        title: 'Koinonia Audio 2025',
        year: 2025,
        url: 'https://drive.google.com/drive/folders/1-XMIPQBokrtoz0j5YQF1UVhY6HDuFURR',
    },
];

export function KoinoniaPage() {
    return (
        <motion.div
            className="koinonia-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="koinonia-page__header">
                <div className="koinonia-page__header-content">
                    <div className="koinonia-page__icon">
                        <Music size={48} />
                    </div>
                    <div>
                        <h1 className="koinonia-page__title">Koinonia Sermons</h1>
                        <p className="koinonia-page__subtitle">
                            Access and listen to Koinonia sermon recordings from past years
                        </p>
                    </div>
                </div>
            </div>

            {/* Sermon Links Grid */}
            <div className="koinonia-page__grid">
                {SERMON_LINKS.map((sermon, index) => (
                    <motion.a
                        key={sermon.url}
                        href={sermon.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sermon-link"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card glass hover className="sermon-card">
                            <div className="sermon-card__content">
                                <div className="sermon-card__header">
                                    <div className="sermon-card__icon">
                                        <Music size={24} />
                                    </div>
                                    <div className="sermon-card__year">
                                        {sermon.year}
                                    </div>
                                </div>

                                <div className="sermon-card__body">
                                    <h3 className="sermon-card__title">{sermon.title}</h3>
                                    <p className="sermon-card__description">
                                        Listen to all sermons from {sermon.year}
                                    </p>
                                </div>

                                <div className="sermon-card__footer">
                                    <span className="sermon-card__link-text">Open Playlist</span>
                                    <ExternalLink size={18} />
                                </div>
                            </div>
                        </Card>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
