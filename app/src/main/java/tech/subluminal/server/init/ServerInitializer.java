package tech.subluminal.server.init;

import org.pmw.tinylog.Logger;
import tech.subluminal.server.logic.ChatManager;
import tech.subluminal.server.logic.ConnectionMessageDistributor;
import tech.subluminal.server.logic.LobbyManager;
import tech.subluminal.server.logic.MessageDistributor;
import tech.subluminal.server.logic.PingManager;
import tech.subluminal.server.logic.UserManager;
import tech.subluminal.server.logic.game.GameManager;
import tech.subluminal.server.net.SocketConnectionManager;
import tech.subluminal.server.stores.GameStore;
import tech.subluminal.server.stores.InMemoryGameStore;
import tech.subluminal.server.stores.InMemoryLobbyStore;
import tech.subluminal.server.stores.InMemoryPingStore;
import tech.subluminal.server.stores.InMemoryUserStore;
import tech.subluminal.server.stores.LobbyStore;
import tech.subluminal.server.stores.PingStore;
import tech.subluminal.server.stores.UserStore;
import tech.subluminal.shared.net.ConnectionManager;

/**
 * Assembles the server-side architecture.
 */
public class ServerInitializer {

  /**
   * Initializes the server and creates the needed objects.
   *
   * @param port to bind the server to.
   */
  public static void init(int port, boolean debug) {
    Logger.info("Starting server ...");
    ConnectionManager connectionManager = new SocketConnectionManager(port);

    MessageDistributor messageDistributor = new ConnectionMessageDistributor(connectionManager);

    UserStore userStore = new InMemoryUserStore();
    PingStore pingStore = new InMemoryPingStore();
    LobbyStore lobbyStore = new InMemoryLobbyStore();
    GameStore gameStore = new InMemoryGameStore();

    new UserManager(userStore, messageDistributor);
    new PingManager(pingStore, userStore, messageDistributor);
    new ChatManager(messageDistributor, userStore, lobbyStore);
    GameManager gameManager = new GameManager(gameStore, lobbyStore, messageDistributor);
    new LobbyManager(lobbyStore, userStore, messageDistributor, gameManager);
  }
}
