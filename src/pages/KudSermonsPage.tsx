import { motion } from 'framer-motion';
import { ExternalLink, Music } from 'lucide-react';
import { Card } from '../components/ui/Card';
import './KudSermonsPage.css';

interface SermonLink {
    title: string;
    description: string;
    url: string;
}

const SERMON_LINKS: SermonLink[] = [
    {
        title: 'KUD Audio 2025',
        description: 'Listen to KUD sermon recordings from 2025',
        url: 'https://drive.google.com/drive/folders/1_v3kKdEc4pUv_gkkIebdeGwft5EWHR1b?usp=drive_link',
    },
    {
        title: 'KUD Audio Retreat 2025',
        description: 'KUD Audio Retreat recordings from 2025',
        url: 'https://drive.google.com/drive/folders/1OEKVdGsdop1bNYyQiiD28LXKP25NAdLY?usp=drive_link',
    },
    {
        title: 'KUD Audio Retreat 2026',
        description: 'KUD Audio Retreat recordings from 2026',
        url: 'https://drive.google.com/drive/folders/1lcq6HVhs_ejFGHhygbLc2HYDpK2Txy9B?usp=drive_link',
    },
];

export function KudSermonsPage() {
    return (
        <motion.div
            className="kud-sermons-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="kud-sermons-page__header">
                <div className="kud-sermons-page__header-content">
                    <div className="kud-sermons-page__icon">
                        <Music size={48} />
                    </div>
                    <div>
                        <h1 className="kud-sermons-page__title">KUD Sermons</h1>
                        <p className="kud-sermons-page__subtitle">
                            Access and listen to KUD sermon recordings and retreat sessions
                        </p>
                    </div>
                </div>
            </div>

            {/* Sermon Links Grid */}
            <div className="kud-sermons-page__grid">
                {SERMON_LINKS.map((sermon, index) => (
                    <motion.a
                        key={sermon.url}
                        href={sermon.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kud-sermon-link"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card glass hover className="kud-sermon-card">
                            <div className="kud-sermon-card__content">
                                <div className="kud-sermon-card__header">
                                    <div className="kud-sermon-card__icon">
                                        <Music size={24} />
                                    </div>
                                </div>

                                <div className="kud-sermon-card__body">
                                    <h3 className="kud-sermon-card__title">{sermon.title}</h3>
                                    <p className="kud-sermon-card__description">
                                        {sermon.description}
                                    </p>
                                </div>

                                <div className="kud-sermon-card__footer">
                                    <span className="kud-sermon-card__link-text">Open Playlist</span>
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
