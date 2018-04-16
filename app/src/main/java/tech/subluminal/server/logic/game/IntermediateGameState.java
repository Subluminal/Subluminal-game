package tech.subluminal.server.logic.game;

import static tech.subluminal.shared.util.function.FunctionalUtils.ifPresent;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.pmw.tinylog.Logger;
import tech.subluminal.server.stores.records.Star;
import tech.subluminal.shared.stores.records.game.Coordinates;
import tech.subluminal.shared.stores.records.game.Fleet;
import tech.subluminal.shared.stores.records.game.Movable;
import tech.subluminal.shared.stores.records.game.Ship;

public class IntermediateGameState {

  private static final double DISTANCE_THRESHOLD = 0.00000001;

  private final double deltaTime;
  private final Map<String, List<Fleet>> destroyedFleets;
  private final Set<String> destroyedPlayers = new HashSet<>();
  private final Map<String, Map<String, Optional<Fleet>>> fleetsOnStars;
  private final Map<String, Map<String, Optional<Ship>>> motherShipsOnStars;
  private final Map<String, Map<String, Fleet>> fleetsUnderway;
  private final Map<String, Optional<Ship>> motherShipsUnderway;
  private final Map<String, Star> stars;
  private final Set<String> players;
  private final PriorityQueue<PriorityRunnable> tasks = new PriorityQueue<>(
      Comparator.reverseOrder());

  public IntermediateGameState(double deltaTime, Map<String, Star> stars, Set<String> players) {
    this.deltaTime = deltaTime;
    this.stars = stars;
    this.players = players;

    fleetsOnStars = createMapWithKeys(stars.keySet(),
        () -> createMapWithKeys(players, Optional::empty));
    motherShipsOnStars = createMapWithKeys(stars.keySet(),
        () -> createMapWithKeys(players, Optional::empty));

    fleetsUnderway = createMapWithKeys(players, HashMap::new);

    destroyedFleets = createMapWithKeys(players, LinkedList::new);
    motherShipsUnderway = createMapWithKeys(players, Optional::empty);
  }

  public void advance() {
    stars.keySet().forEach(starID -> colonisationTick(starID, deltaTime));

    stars.replaceAll((starID, star) ->
        star.advancedBy(deltaTime,
            time -> tasks.add(new PriorityRunnable(time, () -> generateShips(starID))),
            time -> tasks.add(new PriorityRunnable(time, () -> dematerializeTick(starID))))
    );

    fleetsUnderway.forEach((playerID, fleetMap) -> {
      fleetMap.keySet().forEach(fleetID -> moveFleet(0.0, playerID, fleetID, deltaTime));
    });

    motherShipsUnderway.forEach((playerID, optShip) -> {
      optShip.ifPresent(ship -> moveMotherShip(0.0, playerID, ship.getID(), deltaTime));
    });

    while (!tasks.isEmpty()) {
      tasks.poll().run();
    }
  }

  private void moveFleet(double start, String playerID, String fleetID, double deltaTimeLeft) {
    Fleet fleet = fleetsUnderway.get(playerID).get(fleetID);
    Star star = stars.get(fleet.getTargetIDs().get(0));

    double timeToArrive = fleet.getTimeToReach(star.getCoordinates());
    if (deltaTimeLeft < timeToArrive) {
      Fleet newFleet = new Fleet(
          fleet.getPositionMovingTowards(star.getCoordinates(), deltaTimeLeft),
          fleet.getNumberOfShips(), fleetID, fleet.getTargetIDs(), fleet.getEndTarget(),
          fleet.getSpeed());
      fleetsUnderway.get(playerID).put(fleetID, newFleet);
    } else {
      fleet.setCoordinates(
          new Coordinates(star.getCoordinates().getX(), star.getCoordinates().getY()));
      double newStart = start + timeToArrive;
      if (fleet.getTargetIDs().size() == 1) {
        tasks.add(new PriorityRunnable(newStart, () -> {
          fleetsUnderway.get(playerID).remove(fleetID);
          addFleetToStar(fleet, playerID, star.getID());
        }));
      } else {
        fleet.getTargetIDs().remove(0);
        tasks.add(new PriorityRunnable(newStart,
            () -> {
              passFleetByStar(playerID, fleetID, star.getID());
              moveFleet(newStart, playerID, fleetID, deltaTimeLeft - timeToArrive);
            }));
      }
    }
  }

  private void moveMotherShip(double start, String playerID, String shipID, double deltaTimeLeft) {
    Ship ship = motherShipsUnderway.get(playerID).get();
    Star star = stars.get(ship.getTargetIDs().get(0));

    double timeToArrive = ship.getTimeToReach(star.getCoordinates());
    Logger.debug("TIME TO ARRIVE: " + timeToArrive);
    Logger.debug("DELTA TIME TO ARIVE: " + deltaTimeLeft);
    if (deltaTimeLeft < timeToArrive) {
      Logger.debug(
          "old x: " + ship.getCoordinates().getX() + " old y: " + ship.getCoordinates().getY());
      Logger.debug(
          "new x: " + ship.getPositionMovingTowards(star.getCoordinates(), deltaTimeLeft).getX()
              + " new y: " + ship.getPositionMovingTowards(star.getCoordinates(), deltaTimeLeft)
              .getY());
      Ship newShip = new Ship(
          ship.getPositionMovingTowards(star.getCoordinates(), deltaTimeLeft), shipID,
          ship.getTargetIDs(), ship.getEndTarget(), ship.getSpeed());
      motherShipsUnderway.put(playerID, Optional.of(newShip));
    } else {
      ship.setCoordinates(
          new Coordinates(star.getCoordinates().getX(), star.getCoordinates().getY()));
      double newStart = start + timeToArrive;
      if (ship.getTargetIDs().size() == 1) {
        tasks.add(new PriorityRunnable(newStart, () -> {
          motherShipsUnderway.remove(playerID);
          addMotherShipToStar(ship, playerID, star.getID());
        }));
      } else {
        ship.getTargetIDs().remove(0);
        tasks.add(new PriorityRunnable(newStart,
            () -> {
              passMotherShipByStar(playerID, shipID, star.getID());
              moveMotherShip(newStart, playerID, shipID, deltaTimeLeft - timeToArrive);
            }));
      }
    }
  }

  private void passMotherShipByStar(String playerID, String shipID, String id) {
    // TODO: implement this
  }

  private void passFleetByStar(String playerID, String fleetID, String id) {
    // TODO: implement this
  }

  private void colonisationTick(String starID, double deltaTime) {
    String highestID = null;
    int highest = 0;
    for (String playerID : players) {
      int score = fleetsOnStars.get(starID).get(playerID).map(Fleet::getNumberOfShips).orElse(0)
          + motherShipsOnStars.get(starID).get(playerID).map(s -> 2).orElse(0);
      if (score > highest) {
        highest = score;
        highestID = playerID;
      }
    }
    fleetsOnStars.get(starID).forEach((fleetID, fleet) -> {

    });

    if (highestID != null) {
      Star star = stars.get(starID);
      double diff = highestID.equals(star.getOwnerID())
          ? highest * deltaTime * 0.1
          : -highest * deltaTime * 0.1;

      stars.put(starID, new Star(highestID, Math.max(Math.min(star.getPossession() + diff, 1.0), 0.0),
          star.getCoordinates(), starID, star.isGenerating(), star.getJump(), star.getDematRate(),
          star.getNextDemat(), star.getGenerationRate(), star.getNextShipgen()));
    }
  }

  private void dematerializeTick(String starID) {
    // TODO: implement this
  }

  private void generateShips(String starID) {
    // TODO: implement this
  }

  public void addFleet(Fleet fleet, String playerID) {
    if (isOnStar(fleet)) {
      addFleetToStar(fleet, playerID, fleet.getTargetIDs().get(0));
    } else {
      setFleetUnderway(fleet, playerID);
    }
  }

  private void setFleetUnderway(Fleet fleet, String playerID) {
    fleetsUnderway.get(playerID).put(fleet.getID(), fleet);
  }

  public void addMotherShip(Ship ship, String playerID) {
    if (isOnStar(ship)) {
      addMotherShipToStar(ship, playerID, ship.getEndTarget());
    } else {
      setMotherShipUnderway(ship, playerID);
    }
  }

  private void setMotherShipUnderway(Ship ship, String playerID) {
    motherShipsUnderway.put(playerID, Optional.of(ship));
  }

  private void addMotherShipToStar(Ship ship, String playerID, String starID) {
    Ship newShip = ship.getTargetIDs().size() == 0
        ? ship
        : new Ship(ship.getCoordinates(), ship.getID(), Collections.emptyList(), starID,
            ship.getSpeed());
    motherShipsOnStars.get(starID).put(playerID, Optional.of(newShip));
  }

  private boolean isOnStar(Movable movable) {
    return movable.getTargetIDs().size() == 0
        || movable.getTargetIDs().size() == 1
        && movable.getDistanceFrom(stars.get(movable.getTargetIDs().get(0))) < DISTANCE_THRESHOLD;
  }

  private void addFleetToStar(Fleet fleet, String playerID, String starID) {
    Optional<Fleet> optionalFleet = fleetsOnStars.get(starID).get(playerID);
    ifPresent(optionalFleet,
        oldFleet -> {
          fleetsOnStars.get(starID)
              .put(playerID, Optional.of(oldFleet.expanded(fleet.getNumberOfShips())));
          destroyedFleets.get(playerID).add(fleet);
        },
        () -> {
          Fleet newFleet = fleet.getTargetIDs().size() == 0
              ? fleet
              : new Fleet(fleet.getCoordinates(), fleet.getNumberOfShips(), fleet.getID(),
                  Collections.emptyList(), starID, fleet.getSpeed());

          fleetsOnStars.get(starID)
              .put(playerID, Optional.of(newFleet));
        }
    );
  }

  private static <E> Map<String, E> createMapWithKeys(Set<String> keys, Supplier<E> supplier) {
    return keys.stream().collect(Collectors.toMap(id -> id, id -> supplier.get()));
  }

  public Map<String, List<Fleet>> getDestroyedFleets() {
    return destroyedFleets;
  }

  public Set<String> getDestroyedPlayers() {
    return destroyedPlayers;
  }

  public Map<String, Map<String, Optional<Fleet>>> getFleetsOnStars() {
    return fleetsOnStars;
  }

  public Map<String, Map<String, Optional<Ship>>> getMotherShipsOnStars() {
    return motherShipsOnStars;
  }

  public Map<String, Map<String, Fleet>> getFleetsUnderway() {
    return fleetsUnderway;
  }

  public Map<String, Optional<Ship>> getMotherShipsUnderway() {
    return motherShipsUnderway;
  }

  public Map<String, Star> getStars() {
    return stars;
  }
}