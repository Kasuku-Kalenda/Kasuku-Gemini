import React from 'react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EVENTS, ALL_TRAINING_MODULES, THEMES, CREATORS, FEATURED_ITEMS } from '../../constants';
import { ContentIcon } from '../../components/icons/ContentIcon';
import { ModulesIcon } from '../../components/icons/ModulesIcon';
import { UsersIcon } from '../../components/icons/UsersIcon';
import { ThemeIcon } from '../../components/icons/ThemeIcon';
import { MegaphoneIcon } from '../../components/icons/MegaphoneIcon';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';

interface AdminDashboardPageProps {
  navigateTo: (view: 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewEvent' | 'adminNewModule' | 'adminFeatured') => void;
}

const StatCard: React.FC<{title: string, value: number, icon: React.ReactNode, onClick: () => void, delay?: number}> = ({title, value, icon, onClick, delay = 0}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <Card 
            onClick={onClick} 
            className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRightIcon className="h-4 w-4 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black tracking-tight">{value}</div>
            </CardContent>
        </Card>
    </motion.div>
);

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigateTo }) => {
  return (
    <AdminLayout currentView="adminDashboard" navigateTo={navigateTo as any}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-dark">Tableau de Bord</h1>
                <p className="text-muted-foreground">
                    Vue d'ensemble de vos contenus et activités culturelles.
                </p>
            </div>
            <div className="flex gap-3">
                <Button onClick={() => navigateTo('adminNewEvent')} className="rounded-full px-6">
                    + Nouvel Événement
                </Button>
                <Button onClick={() => navigateTo('adminNewModule')} variant="secondary" className="rounded-full px-6">
                    + Nouveau Module
                </Button>
            </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <StatCard 
                title="À la une" 
                value={FEATURED_ITEMS.length} 
                icon={<MegaphoneIcon className="h-5 w-5" />} 
                onClick={() => navigateTo('adminFeatured')} 
                delay={0.1}
            />
            <StatCard 
                title="Événements" 
                value={EVENTS.length} 
                icon={<ContentIcon className="h-5 w-5" />} 
                onClick={() => navigateTo('adminEvents')} 
                delay={0.2}
            />
            <StatCard 
                title="Modules" 
                value={ALL_TRAINING_MODULES.length} 
                icon={<ModulesIcon className="h-5 w-5" />} 
                onClick={() => navigateTo('adminModules')} 
                delay={0.3}
            />
            <StatCard 
                title="Thèmes" 
                value={THEMES.length} 
                icon={<ThemeIcon className="h-5 w-5" />} 
                onClick={() => navigateTo('adminThemes')}
                delay={0.4}
            />
            <StatCard 
                title="Créateurs" 
                value={CREATORS.length} 
                icon={<UsersIcon className="h-5 w-5" />} 
                onClick={() => {}} 
                delay={0.5}
            />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 rounded-[2rem] shadow-soft border-none bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <ContentIcon className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="font-medium">Bientôt disponible</p>
                        <p className="text-sm max-w-[250px]">Les journaux d'audit et l'historique des modifications s'afficheront ici.</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-3 rounded-[2rem] shadow-soft border-none bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Derniers Contenus</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <ModulesIcon className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="font-medium">Bientôt disponible</p>
                        <p className="text-sm max-w-[250px]">Les derniers événements et modules créés apparaîtront ici.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </AdminLayout>
  );
};
