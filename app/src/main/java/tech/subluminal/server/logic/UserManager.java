package tech.subluminal.server.logic;

import java.io.IOException;
import java.util.Set;
import java.util.stream.Collectors;
import tech.subluminal.server.stores.UserStore;
import tech.subluminal.shared.messages.InitialUsers;
import tech.subluminal.shared.messages.LoginReq;
import tech.subluminal.shared.messages.LoginRes;
import tech.subluminal.shared.messages.LogoutReq;
import tech.subluminal.shared.messages.PlayerJoin;
import tech.subluminal.shared.messages.PlayerLeave;
import tech.subluminal.shared.messages.PlayerUpdate;
import tech.subluminal.shared.messages.UsernameReq;
import tech.subluminal.shared.messages.UsernameRes;
import tech.subluminal.shared.net.Connection;
import tech.subluminal.shared.stores.records.User;

/**
 * Manages the information of connected users.
 */
public class UserManager {

  private final MessageDistributor distributor;
  private UserStore userStore;

  /**
   * Creates a user manager from a user store and a message distributor.
   *
   * @param userStore the user store to save users in.
   * @param distributor the message distributor this manager communicates over.
   */
  public UserManager(UserStore userStore, MessageDistributor distributor) {
    this.userStore = userStore;

    this.distributor = distributor;
    distributor.addConnectionOpenedListener(this::attachHandlers);
    distributor.addConnectionClosedListener(this::onConnectionClosed);
  }

  private void onConnectionClosed(String id) {
    userStore.connectedUsers().removeByID(id);

    distributor.broadcast(new PlayerLeave(id));
  }

  private void attachHandlers(String id, Connection connection) {
    connection.registerHandler(LoginReq.class, LoginReq::fromSON,
        req -> onLogin(id, connection, req));
    connection.registerHandler(UsernameReq.class, UsernameReq::fromSON,
        req -> onUsernameChange(id, connection, req));
    connection.registerHandler(LogoutReq.class, LogoutReq::fromSON,
        req -> onLogout(connection));
  }

  private void onLogout(Connection connection) {
    try {
      connection.close();
    } catch (IOException e) {
      //TODO: handle this accordingly
    }
  }

  /**
   * This function handles a user trying to change their username on the server.
   *
   * @param id the id of the user/connection as determined by the message distributor.
   * @param connection the connection belonging to the user.
   * @param usernameReq the username change request sent by the user.
   */
  private void onUsernameChange(String id, Connection connection, UsernameReq usernameReq) {
    String oldUsername = usernameReq.getUsername();
    final String username = getUnusedUsername(oldUsername);
    userStore.connectedUsers().getByID(id)
        .ifPresent(syncUser -> syncUser.update(u -> new User(username, id)));

    connection.sendMessage(new UsernameRes(username));

    distributor.broadcast(new PlayerUpdate(id, username));
  }

  /**
   * This function handles a user trying to log in to the server.
   *
   * @param id the id of the user/connection as determined by the message distributor.
   * @param connection the connection belonging to the user.
   * @param loginReq the login request sent by the user.
   */
  private void onLogin(String id, Connection connection, LoginReq loginReq) {
    String username = loginReq.getUsername();

    username = getUnusedUsername(username);
    User user = new User(username, id);
    userStore.connectedUsers().add(user);

    connection.sendMessage(new LoginRes(username, id));
    InitialUsers initialUsers = new InitialUsers();
    userStore.connectedUsers().getAll().consume(
        users -> users.stream().map(synUser -> synUser.use(u -> u)).forEach(initialUsers::addUser));
    connection.sendMessage(initialUsers);

    distributor.sendMessageToAllExcept(new PlayerJoin(user), id);
  }

  private String getUnusedUsername(String requestedUsername) {
    Set<String> users = userStore.connectedUsers().getAll().use(us ->
        us.stream()
            .map(syncUser -> syncUser.use(User::getUsername))
            .collect(Collectors.toSet()));

    String username = requestedUsername;
    int i = 1;
    while (users.contains(username)) {
      username = requestedUsername + i;
      i++;
    }
    return username;
  }
}