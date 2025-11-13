import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Pokemon } from '../types/pokemon';
import { pokemonApi } from '../services/pokemonApi';
import { usePokemonPower } from '../hooks/usePokemonPower';
import { PowerLevelDisplay } from '../components/PowerLevelDisplay';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonDetail'>;

export const PokemonDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { pokemonId } = route.params;
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {
    powerLevel,
    stepsFromPower,
    totalSteps,
    isLoading: isPowerLoading,
    isTracking,
    hasPermission,
    canAskAgain,
    error: stepError,
    requestPermission,
    openSettings,
    refreshPower,
  } = usePokemonPower(pokemon);

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await pokemonApi.getPokemonById(pokemonId);
        setPokemon(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Pokemon';
        setError(errorMessage);
        console.error('Error loading Pokemon:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPokemon();
  }, [pokemonId]);

  const handleSavePower = async () => {
    await refreshPower();
    Alert.alert('Success', 'Power level saved!');
  };

  const getTypeColor = (typeName: string): string => {
    const typeColors: Record<string, string> = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    return typeColors[typeName.toLowerCase()] || '#A8A878';
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading Pokemon...</Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Pokemon not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    pokemon.sprites.front_default;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.name}>{pokemon.name}</Text>
        <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')}</Text>
      </View>

      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        </View>
      )}

      <PowerLevelDisplay
        powerLevel={powerLevel}
        stepsFromPower={stepsFromPower}
        totalSteps={totalSteps}
        isLoading={isPowerLoading}
        isTracking={isTracking}
        error={stepError}
        hasPermission={hasPermission}
        canAskAgain={canAskAgain}
        onRequestPermission={requestPermission}
        onOpenSettings={openSettings}
      />

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Height</Text>
          <Text style={styles.detailValue}>{pokemon.height / 10}m</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>{pokemon.weight / 10}kg</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base Experience</Text>
          <Text style={styles.detailValue}>{pokemon.base_experience}</Text>
        </View>
      </View>

      <View style={styles.typesContainer}>
        <Text style={styles.sectionTitle}>Types</Text>
        <View style={styles.typesRow}>
          {pokemon.types.map((type) => (
            <View
              key={type.slot}
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(type.type.name) },
              ]}
            >
              <Text style={styles.typeText}>{type.type.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSavePower}
        disabled={isPowerLoading}
      >
        <Text style={styles.saveButtonText}>Save Power Level</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  id: {
    fontSize: 18,
    color: '#999',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  image: {
    width: 200,
    height: 200,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  typesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

