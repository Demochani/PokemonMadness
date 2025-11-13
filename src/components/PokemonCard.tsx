import React, { useRef, useEffect, useState, FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { PokemonListItem } from '../types/pokemon';
import { pokemonApi } from '../services/pokemonApi';

interface PokemonCardProps {
  pokemon: PokemonListItem;
  onPress: (pokemonId: number) => void;
}

export const PokemonCard: FC<PokemonCardProps> = ({ pokemon, onPress }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pokemonId = pokemonApi.extractPokemonIdFromUrl(pokemon.url);

  useEffect(() => {
    const loadPokemonImage = async () => {
      try {
        const pokemonData = await pokemonApi.getPokemonById(pokemonId);
        const image =
          pokemonData.sprites.other?.['official-artwork']?.front_default ||
          pokemonData.sprites.front_default;
        setImageUrl(image);
      } catch (error) {
        console.error('Error loading Pokemon image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPokemonImage();
  }, [pokemonId]);

  useEffect(() => {
    if (!isLoading && imageUrl) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, imageUrl, fadeAnim, scaleAnim]);

  const handlePress = () => {
    onPress(pokemonId);
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.imageContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : null}
        </View>
        <Text style={styles.name}>{pokemon.name}</Text>
        <Text style={styles.id}>#{String(pokemonId).padStart(3, '0')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: 120,
    height: 120,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    color: '#999',
  },
});

