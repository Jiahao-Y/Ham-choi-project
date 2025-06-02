import { NextApiRequest, NextApiResponse } from 'next';
import  supabase  from '../../utils/supabaseClient';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    const { round, game_id } = req.body;

    const { data: gameResults, error: gameError} = await supabase
        .from ('game_results')
        .select('id, winning_team_id, losing_team_id')
        .eq('round', round)
        .eq('game_id', game_id)
        .single();

    if (gameError || !gameResults) {
        return res.status(404).json({ message: 'Game result not found' });
    }

    const { id, winning_team_id, losing_team_id } = gameResults;

    const { error: swapError } = await supabase
        .from('game_results')
        .update({
            winning_team_id: losing_team_id,
            losing_team_id: winning_team_id
        })
        .eq('id', id);

    if (swapError) {
        return res.status(500).json({ message: 'Error swapping game results' });
    }

    const { data: winningTeam } = await supabase.from('teams').select('score').eq('id', winning_team_id).single();
    const { data: losingTeam } = await supabase.from('teams').select('score').eq('id', losing_team_id).single();

    if (!winningTeam || !losingTeam) {
        return res.status(404).json({ message: 'Team not found' });
    }

    await supabase.from('teams').update({ score: winningTeam.score - 1 }).eq('id', winning_team_id);
    await supabase.from('teams').update({ score: losingTeam.score + 1 }).eq('id', losing_team_id);

    return res.status(200).json({ message: 'Game results swapped successfully' });
}