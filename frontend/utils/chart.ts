/**
 * Recupera el color hexadecimal de un constructor.
 * @param constructorId - El ID o nombre del equipo (ej: 'Red Bull Racing', 'Ferrari')
 * @param teamsMapping - El objeto de datos que devuelve tu hook useTeams
 * @returns string - El color hexadecimal (ej: '#1E41FF')
 */
export const getConstructorHex = (
    constructorId: string, 
    teamsMapping: any // Reemplazar con el tipo correcto de tu interfaz
): string => {
    // 1. Intentamos obtener el color desde el mapping de la API
    const teamColor = teamsMapping?.data?.[constructorId]?.color;

    if (teamColor) {
        return teamColor.startsWith('#') ? teamColor : `#${teamColor}`;
    }

    // 2. Colores por defecto (Fallback) por si la API no tiene el dato en ese momento
    const defaultColors: Record<string, string> = {
        'Red Bull Racing': '#3671C6',
        'Ferrari': '#E80020',
        'Mercedes': '#27F4D2',
        'McLaren': '#FF8000',
        'Aston Martin': '#229971',
        'Alpine': '#0093CC',
        'Williams': '#64C4FF',
        'RB': '#6692FF',
        'Sauber': '#52E252',
        'Haas F1 Team': '#B6BABD'
    };

    return defaultColors[constructorId] || '#475569'; // Gris pizarra si no encuentra nada
};